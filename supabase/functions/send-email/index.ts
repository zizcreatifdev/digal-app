// Supabase Edge Function — send-email
// Uses Resend (https://resend.com) to send transactional emails.
// Required env var: RESEND_API_KEY  (set in Supabase project secrets)

import { Resend } from "npm:resend@3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Digal <noreply@digal.app>";

interface EmailPayload {
  type: "bienvenue" | "expiration_30" | "expiration_15" | "expiration_7" | "renouvellement";
  to: string;
  prenom?: string;
  expiration_date?: string;
  plan?: string;
}

function buildEmail(payload: EmailPayload): { subject: string; html: string } {
  const name = payload.prenom ?? "cher utilisateur";
  switch (payload.type) {
    case "bienvenue":
      return {
        subject: "Bienvenue sur Digal 🎉",
        html: `
          <h2>Bienvenue ${name} !</h2>
          <p>Votre compte Digal est activé. Connectez-vous dès maintenant pour gérer vos clients et contenus.</p>
          <p>Si vous avez des questions, répondez directement à cet email.</p>
          <p>L'équipe Digal</p>
        `,
      };
    case "expiration_30":
      return {
        subject: "Votre licence Digal expire dans 30 jours",
        html: `
          <h2>Bonjour ${name},</h2>
          <p>Votre licence <strong>${payload.plan ?? "Digal"}</strong> expire le <strong>${payload.expiration_date}</strong>.</p>
          <p>Pour continuer à bénéficier de toutes les fonctionnalités, renouvelez votre licence en saisissant une clé dans <strong>Paramètres → Ma licence</strong>.</p>
          <p>L'équipe Digal</p>
        `,
      };
    case "expiration_15":
      return {
        subject: "Plus que 15 jours — renouvelez votre licence Digal",
        html: `
          <h2>Bonjour ${name},</h2>
          <p>Il ne reste que <strong>15 jours</strong> avant l'expiration de votre licence (${payload.expiration_date}).</p>
          <p>Contactez votre gestionnaire de compte pour obtenir une clé de renouvellement.</p>
          <p>L'équipe Digal</p>
        `,
      };
    case "expiration_7":
      return {
        subject: "⚠️ Urgence : 7 jours avant expiration de votre licence Digal",
        html: `
          <h2>Bonjour ${name},</h2>
          <p><strong>Attention</strong> — votre licence expire dans 7 jours (${payload.expiration_date}).</p>
          <p>Sans renouvellement, votre compte basculera en mode Freemium et certaines fonctionnalités seront désactivées.</p>
          <p>L'équipe Digal</p>
        `,
      };
    case "renouvellement":
      return {
        subject: "Licence Digal renouvelée ✅",
        html: `
          <h2>Bonne nouvelle, ${name} !</h2>
          <p>Votre licence <strong>${payload.plan ?? "Digal"}</strong> a été renouvelée avec succès.</p>
          <p>Nouvelle date d'expiration : <strong>${payload.expiration_date}</strong>.</p>
          <p>L'équipe Digal</p>
        `,
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.type) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { subject, html } = buildEmail(payload);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [payload.to],
      subject,
      html,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("[send-email]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
