// Supabase Edge Function: expiry-reminders
// Scheduled daily via pg_cron. Sends licence expiry warning emails at J-30, J-15, J-7.
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Digal <noreply@digal.app>";

const TEMPLATES: Record<string, { subject: string; body: (name: string, exp: string, plan: string) => string }> = {
  "30": {
    subject: "Votre licence Digal expire dans 30 jours",
    body: (name, exp, plan) =>
      `<h2>Bonjour ${name},</h2><p>Votre licence <strong>${plan}</strong> expire le <strong>${exp}</strong>.</p><p>Pour continuer à bénéficier de toutes les fonctionnalités, renouvelez votre licence dans <strong>Paramètres → Ma licence</strong>.</p><p>L'équipe Digal</p>`,
  },
  "15": {
    subject: "Plus que 15 jours : renouvelez votre licence Digal",
    body: (name, exp, plan) =>
      `<h2>Bonjour ${name},</h2><p>Il ne reste que <strong>15 jours</strong> avant l'expiration de votre licence <strong>${plan}</strong> (${exp}).</p><p>Contactez votre gestionnaire de compte pour obtenir une clé de renouvellement.</p><p>L'équipe Digal</p>`,
  },
  "7": {
    subject: "⚠️ Urgence : 7 jours avant expiration de votre licence Digal",
    body: (name, exp, plan) =>
      `<h2>Bonjour ${name},</h2><p><strong>Attention</strong> : votre licence <strong>${plan}</strong> expire dans 7 jours (${exp}).</p><p>Sans renouvellement, votre compte basculera en mode Freemium et certaines fonctionnalités seront désactivées.</p><p>L'équipe Digal</p>`,
  },
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results: string[] = [];
    let totalSent = 0;

    for (const days of [30, 15, 7] as const) {
      const targetDate = toDateString(addDays(today, days));

      // Find users whose licence expires on exactly targetDate
      const { data: users, error } = await supabase
        .from("users")
        .select("email, prenom, role, plan, licence_expiration")
        .gte("licence_expiration", `${targetDate}T00:00:00`)
        .lt("licence_expiration", `${targetDate}T23:59:59`)
        .not("role", "in", "(freemium,owner,dm)");

      if (error) {
        results.push(`J-${days}: query error: ${error.message}`);
        continue;
      }

      let sent = 0;
      for (const user of users ?? []) {
        const tpl = TEMPLATES[String(days)];
        const expFormatted = new Date(user.licence_expiration!).toLocaleDateString("fr-FR");
        try {
          await resend.emails.send({
            from: FROM,
            to: [user.email],
            subject: tpl.subject,
            html: tpl.body(user.prenom ?? "cher utilisateur", expFormatted, user.plan ?? "Digal"),
          });
          sent++;
        } catch (emailErr) {
          console.warn(`[expiry-reminders] failed to email ${user.email}:`, emailErr);
        }
      }

      results.push(`J-${days}: ${sent} email(s) envoyé(s) (cible: ${targetDate})`);
      totalSent += sent;
    }

    return new Response(
      JSON.stringify({ success: true, totalSent, results, timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[expiry-reminders]", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
