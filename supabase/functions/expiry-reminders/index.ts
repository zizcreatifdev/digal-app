// Supabase Edge Function: expiry-reminders
// Runs daily at 09:00 UTC via pg_cron.
// 1. Sends licence expiry warning emails at J-30, J-15, J-7.
// 2. Sends relance email to freemium users inactive for 30+ days.
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Digal <noreply@digal.app>";
const APP_URL = "https://digal.vercel.app";

// ─── Shared layout ────────────────────────────────────────────────────────────
function wrapHtml(body: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;padding:24px 32px;border-radius:8px;">
      <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #333;">
        <span style="color:#c4522a;font-weight:bold;font-size:22px;">Digal</span>
      </div>
      <div style="color:#f5f0eb;">${body}</div>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #333;font-size:11px;color:#666;">
        © ${new Date().getFullYear()} Digal · digal.sn
      </div>
    </div>
  `;
}

function ctaButton(label: string, href: string): string {
  return `<p style="text-align:center;margin:24px 0;">
    <a href="${href}" style="background:#c4522a;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">${label} →</a>
  </p>`;
}

// ─── Licence expiry templates ─────────────────────────────────────────────────
const LICENCE_TEMPLATES: Record<string, { subject: string; body: (name: string, exp: string, plan: string) => string }> = {
  "30": {
    subject: "Votre licence Digal expire dans 30 jours",
    body: (name, exp, plan) => wrapHtml(`
      <h2>Bonjour ${name},</h2>
      <p>Votre licence <strong>${plan}</strong> expire le <strong>${exp}</strong>.</p>
      <p>Pour continuer à bénéficier de toutes les fonctionnalités, renouvelez votre licence avant cette date.</p>
      ${ctaButton("Renouveler ma licence", `${APP_URL}/dashboard/parametres`)}
      <p>L'équipe Digal</p>
    `),
  },
  "15": {
    subject: "Plus que 15 jours sur votre licence Digal",
    body: (name, exp, plan) => wrapHtml(`
      <h2>Bonjour ${name},</h2>
      <p>Il ne reste que <strong>15 jours</strong> avant l'expiration de votre licence <strong>${plan}</strong> (${exp}).</p>
      <p>Contactez votre gestionnaire de compte pour obtenir une clé de renouvellement.</p>
      ${ctaButton("Renouveler ma licence", `${APP_URL}/dashboard/parametres`)}
      <p>L'équipe Digal</p>
    `),
  },
  "7": {
    subject: "Urgent : votre licence expire dans 7 jours",
    body: (name, exp, plan) => wrapHtml(`
      <h2>Bonjour ${name},</h2>
      <p><strong>Attention</strong> : votre licence <strong>${plan}</strong> expire dans 7 jours (${exp}).</p>
      <p>Sans renouvellement, votre compte basculera en mode Freemium et certaines fonctionnalités seront désactivées.</p>
      ${ctaButton("Renouveler ma licence", `${APP_URL}/dashboard/parametres`)}
      <p>L'équipe Digal</p>
    `),
  },
};

// ─── Freemium relance template ────────────────────────────────────────────────
function buildRelanceHtml(name: string): string {
  return wrapHtml(`
    <h2>On ne vous a pas vu depuis un moment...</h2>
    <p>Bonjour ${name},</p>
    <p>Cela fait plus de 30 jours que vous n'avez pas utilisé Digal. Voici un rappel de ce qui vous attend :</p>
    <ul style="color:#f5f0eb;line-height:1.8;">
      <li>📅 <strong>Calendrier éditorial</strong> — planifiez et validez vos contenus</li>
      <li>🔗 <strong>Liens de validation client</strong> — partagez en un clic</li>
      <li>📊 <strong>Rapports KPI</strong> — analysez vos performances</li>
      <li>🗂️ <strong>Facturation FCFA</strong> — devis et factures pro</li>
    </ul>
    <p>Tout cela disponible gratuitement sur votre compte Freemium.</p>
    ${ctaButton("Reprendre sur Digal", `${APP_URL}/dashboard`)}
    <p>L'équipe Digal</p>
  `);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Main handler ─────────────────────────────────────────────────────────────
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

    // ── Part 1: Licence expiry reminders (J-30, J-15, J-7) ──────────────────
    for (const days of [30, 15, 7] as const) {
      const targetDate = toDateString(addDays(today, days));

      const { data: users, error } = await supabase
        .from("users")
        .select("email, prenom, role, plan, licence_expiration")
        .gte("licence_expiration", `${targetDate}T00:00:00`)
        .lte("licence_expiration", `${targetDate}T23:59:59`)
        .not("role", "in", "(freemium,owner,dm)");

      if (error) {
        results.push(`J-${days}: query error: ${error.message}`);
        continue;
      }

      let sent = 0;
      for (const user of users ?? []) {
        const tpl = LICENCE_TEMPLATES[String(days)];
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

    // ── Part 2: Freemium relance (inactive 30+ days, not yet relanced) ───────
    try {
      const { data: inactiveUsers, error: relanceErr } = await supabase
        .rpc("get_inactive_freemium_users");

      if (relanceErr) {
        results.push(`Relance freemium: query error: ${relanceErr.message}`);
      } else {
        let relanceSent = 0;
        const relancedIds: string[] = [];

        for (const u of (inactiveUsers ?? []) as Array<{ user_email: string; user_prenom: string; user_uid: string }>) {
          try {
            await resend.emails.send({
              from: FROM,
              to: [u.user_email],
              subject: "On ne vous a pas vu depuis un moment...",
              html: buildRelanceHtml(u.user_prenom ?? "cher utilisateur"),
            });
            relanceSent++;
            relancedIds.push(u.user_uid);
          } catch (emailErr) {
            console.warn(`[expiry-reminders] relance failed for ${u.user_email}:`, emailErr);
          }
        }

        // Mark relance_sent = true for all successfully emailed users
        if (relancedIds.length > 0) {
          await supabase
            .from("users")
            .update({ relance_sent: true })
            .in("user_id", relancedIds)
            .then(() => {/* ok */})
            .catch((e: Error) => console.warn("[expiry-reminders] relance flag update failed:", e.message));
        }

        results.push(`Relance freemium: ${relanceSent} email(s) envoyé(s)`);
        totalSent += relanceSent;
      }
    } catch (relanceEx) {
      results.push(`Relance freemium: exception: ${String(relanceEx)}`);
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
