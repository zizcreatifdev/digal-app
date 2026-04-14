// Supabase Edge Function — send-email
// Uses Resend (https://resend.com) to send transactional emails.
// Required env var: RESEND_API_KEY  (set in Supabase project secrets)

import { Resend } from "npm:resend@3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Digal <noreply@digal.app>";

// Digal logo (blanc+baseline) embedded as base64 SVG for email headers
const DIGAL_LOGO_B64 = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iQ2FscXVlXzEiIGRhdGEtbmFtZT0iQ2FscXVlIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDE5MS44MyAxODQuODkiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuY2xzLTEgewogICAgICAgIGZpbGwtcnVsZTogZXZlbm9kZDsKICAgICAgfQoKICAgICAgLmNscy0xLCAuY2xzLTIgewogICAgICAgIGZpbGw6ICNlOTRlMWI7CiAgICAgIH0KCiAgICAgIC5jbHMtMyB7CiAgICAgICAgZmlsbDogI2ZmZjsKICAgICAgICBmb250LWZhbWlseTogT3V0Zml0LVJlZ3VsYXIsIE91dGZpdDsKICAgICAgICBmb250LXNpemU6IDkuNzNweDsKICAgICAgICBmb250LXZhcmlhdGlvbi1zZXR0aW5nczogJ3dnaHQnIDQwMDsKICAgICAgfQoKICAgICAgLmNscy00IHsKICAgICAgICBsZXR0ZXItc3BhY2luZzogMGVtOwogICAgICB9CgogICAgICAuY2xzLTUgewogICAgICAgIGxldHRlci1zcGFjaW5nOiAwZW07CiAgICAgIH0KCiAgICAgIC5jbHMtNiB7CiAgICAgICAgbGV0dGVyLXNwYWNpbmc6IC0uMDNlbTsKICAgICAgfQoKICAgICAgLmNscy03IHsKICAgICAgICBsZXR0ZXItc3BhY2luZzogLS4wMmVtOwogICAgICB9CgogICAgICAuY2xzLTggewogICAgICAgIGxldHRlci1zcGFjaW5nOiAtLjAyZW07CiAgICAgIH0KCiAgICAgIC5jbHMtOSB7CiAgICAgICAgbGV0dGVyLXNwYWNpbmc6IC0uMDFlbTsKICAgICAgfQoKICAgICAgLmNscy0xMCB7CiAgICAgICAgbGV0dGVyLXNwYWNpbmc6IC0uMDFlbTsKICAgICAgfQoKICAgICAgLmNscy0xMSB7CiAgICAgICAgbGV0dGVyLXNwYWNpbmc6IC0uMDJlbTsKICAgICAgfQoKICAgICAgLmNscy0xMiB7CiAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDBlbTsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPGc+CiAgICA8Zz4KICAgICAgPHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjEzOS4wOSA3Ni42MyAxMzkuMDkgMTEyLjAyIDEzMy44NyAxMTIuMDIgMTMzLjg3IDExOS44NSAxNDYuOTEgMTE5Ljg1IDE0Ni45MSA3Ni42MyAxMzkuMDkgNzYuNjMiLz4KICAgICAgPHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjEyMi41NSA3Ni42MyAxMjIuNTUgMTI1Ljk0IDExNy4zMyAxMjUuOTQgMTE3LjMzIDEzMy43NyAxMzAuMzkgMTMzLjc3IDEzMC4zOSA3Ni42MyAxMjIuNTUgNzYuNjMiLz4KICAgICAgPHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjEwNi4wMiA3Ni42MyAxMDYuMDIgMTQwLjE1IDc5LjU1IDE0MC4xNSA3OS41NSAxNDcuOTggMTEzLjg2IDE0Ny45OCAxMTMuODYgNzYuNjMgMTA2LjAyIDc2LjYzIi8+CiAgICAgIDxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSI1NSAxMDkgNTUgNDguNSA2MC4yMiA0OC41IDYwLjIyIDQwLjY3IDQ3LjE4IDQwLjY3IDQ3LjE4IDEwOSA1NSAxMDkiLz4KICAgICAgPHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjcxLjU0IDEwOSA3MS41NCAzNC4yOSA3Ni43NiAzNC4yOSA3Ni43NiAyNi40NiA2My43MSAyNi40NiA2My43MSAxMDkgNzEuNTQgMTA5Ii8+CiAgICAgIDxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSI4MS4yOCAzNC4yOSAxMTAuNjcgMzQuMjkgMTEwLjY3IDM5LjIyIDExOC43OSAzOS4yMiAxMTguNzkgMjYuNDYgODEuMjggMjYuNDYgODEuMjggMzQuMjkiLz4KICAgICAgPHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjgxLjI4IDUwLjgyIDEyNC44NyA1MC44MiAxMjQuODcgNTUuNzUgMTMyLjcxIDU1Ljc1IDEzMi43MSA0Mi43IDgxLjI4IDQyLjcgODEuMjggNTAuODIiLz4KICAgICAgPHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjgxLjI4IDY3LjM1IDEzOS4wOSA2Ny4zNSAxMzkuMDkgNzIuMjggMTQ2LjkxIDcyLjI4IDE0Ni45MSA1OS41MiA4MS4yOCA1OS41MiA4MS4yOCA2Ny4zNSIvPgogICAgPC9nPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNTAuNzQsMTI4LjczaDQuOTl2NC45OWgtNC45OXYtNC45OVpNNjQuNzIsMTMzLjcxdi00Ljk5aDQuOTl2NC45OWgtNC45OVpNNTcuNzMsMTI4LjczaDQuOTl2NC45OWgtNC45OXYtNC45OVpNNTAuNzQsMTI2Ljczdi00Ljk5aDQuOTl2NC45OWgtNC45OVpNNjQuNzIsMTI2Ljczdi00Ljk5aDQuOTl2NC45OWgtNC45OVpNNzMuMywxMzIuMzZ2LTMuMWgzLjA4djUuODFjMCwxLjc4LS43LDMuNC0xLjg0LDQuNnY4LjMxbC02LjIzLTYuMjNoLTE3LjU1Yy0zLjY4LDAtNi42OC0zLTYuNjgtNi42OHYtMTQuNjljMC0zLjY4LDMtNi42OCw2LjY4LTYuNjhoMTguOTVjMy42OCwwLDYuNjgsMyw2LjY4LDYuNjh2NS44MWgtMy4wOHYtNS44MWMwLTEuOTgtMS42Mi0zLjYtMy42LTMuNmgtMi44NmMuMDIuMS4wNC4yMS4wNC4zMnYxLjYyYzAsLjczLS41OSwxLjMyLTEuMzIsMS4zMnMtMS4zMi0uNTktMS4zMi0xLjMydi0xLjYyYzAtLjExLjAxLS4yMi4wNC0uMzJoLTguMWMuMDMuMS4wNC4yMS4wNC4zMnYxLjYyYzAsLjczLS41OSwxLjMyLTEuMzIsMS4zMnMtMS4zMi0uNTktMS4zMi0xLjMydi0xLjYyYzAtLjExLjAxLS4yMi4wNC0uMzJoLTIuODZjLTEuOTgsMC0zLjYsMS42Mi0zLjYsMy42djE0LjY5YzAsMS45OCwxLjYyLDMuNiwzLjYsMy42aDE4Ljk1YzEuOTgsMCwzLjYtMS42MiwzLjYtMy42di0yLjcxWk01Ny43MywxMjYuNzN2LTQuOTloNC45OXY0Ljk5aC00Ljk5WiIvPgogIDwvZz4KICA8dGV4dCBjbGFzcz0iY2xzLTMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc5LjU1IDE1OS41NCkiPjx0c3BhbiBjbGFzcz0iY2xzLTciIHg9IjAiIHk9IjAiPkw8L3RzcGFuPjx0c3BhbiBjbGFzcz0iY2xzLTEyIiB4PSI1LjE4IiB5PSIwIj5hIHBsPC90c3Bhbj48dHNwYW4gY2xhc3M9ImNscy0xMiIgeD0iMjAuNjkiIHk9IjAiPmE8L3RzcGFuPjx0c3BhbiBjbGFzcz0iY2xzLTkiIHg9IjI2LjMzIiB5PSIwIj50PC90c3Bhbj48dHNwYW4gY2xhc3M9ImNscy0xMCIgeD0iMjkuNzciIHk9IjAiPmU8L3RzcGFuPjx0c3BhbiBjbGFzcz0iY2xzLTYiIHg9IjM0Ljg1IiB5PSIwIj5mPC90c3Bhbj48dHNwYW4geD0iMzguNDciIHk9IjAiPm88L3RzcGFuPjx0c3BhbiBjbGFzcz0iY2xzLTExIiB4PSI0My45NyIgeT0iMCI+cjwvdHNwYW4+PHRzcGFuIGNsYXNzPSJjbHMtNSIgeD0iNDcuODkiIHk9IjAiPm1lPC90c3Bhbj48dHNwYW4geD0iMCIgeT0iMTEuNjgiPmRlcyBDTSBzw6k8L3RzcGFuPjx0c3BhbiBjbGFzcz0iY2xzLTgiIHg9IjQzLjMxIiB5PSIxMS42OCI+cjwvdHNwYW4+PHRzcGFuIGNsYXNzPSJjbHMtNCIgeD0iNDcuMjEiIHk9IjExLjY4Ij5pZXV4LjwvdHNwYW4+PC90ZXh0Pgo8L3N2Zz4=";
const DIGAL_LOGO_HTML = `<img src="data:image/svg+xml;base64,${DIGAL_LOGO_B64}" alt="Digal" width="96" height="48" style="display:block;" />`;

interface EmailPayload {
  type: "bienvenue" | "expiration_30" | "expiration_15" | "expiration_7" | "renouvellement"
    | "rejet_createur" | "waitlist_approuve" | "preview_expire" | "activation";
  to: string;
  prenom?: string;
  expiration_date?: string;
  plan?: string;
  commentaire?: string;        // rejet_createur
  lien_preview?: string;       // waitlist_approuve / preview_expire
  nom_client?: string;         // preview_expire
  activation_link?: string;    // activation
  type_compte_label?: string;  // activation
}

function wrapHtml(body: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;padding:24px 32px;border-radius:8px;">
      <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #333;">
        ${DIGAL_LOGO_HTML}
      </div>
      <div style="color:#f5f0eb;">${body}</div>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #333;font-size:11px;color:#666;">
        © ${new Date().getFullYear()} Digal · digal.sn
      </div>
    </div>
  `;
}

function buildEmail(payload: EmailPayload): { subject: string; html: string } {
  const name = payload.prenom ?? "cher utilisateur";
  switch (payload.type) {
    case "bienvenue":
      return {
        subject: "Bienvenue sur Digal 🎉",
        html: wrapHtml(`
          <h2>Bienvenue ${name} !</h2>
          <p>Votre compte Digal est activé. Connectez-vous dès maintenant pour gérer vos clients et contenus.</p>
          <p>Si vous avez des questions, répondez directement à cet email.</p>
          <p>L'équipe Digal</p>
        `),
      };
    case "expiration_30":
      return {
        subject: "Votre licence Digal expire dans 30 jours",
        html: wrapHtml(`
          <h2>Bonjour ${name},</h2>
          <p>Votre licence <strong>${payload.plan ?? "Digal"}</strong> expire le <strong>${payload.expiration_date}</strong>.</p>
          <p>Pour continuer à bénéficier de toutes les fonctionnalités, renouvelez votre licence en saisissant une clé dans <strong>Paramètres → Ma licence</strong>.</p>
          <p>L'équipe Digal</p>
        `),
      };
    case "expiration_15":
      return {
        subject: "Plus que 15 jours — renouvelez votre licence Digal",
        html: wrapHtml(`
          <h2>Bonjour ${name},</h2>
          <p>Il ne reste que <strong>15 jours</strong> avant l'expiration de votre licence (${payload.expiration_date}).</p>
          <p>Contactez votre gestionnaire de compte pour obtenir une clé de renouvellement.</p>
          <p>L'équipe Digal</p>
        `),
      };
    case "expiration_7":
      return {
        subject: "⚠️ Urgence : 7 jours avant expiration de votre licence Digal",
        html: wrapHtml(`
          <h2>Bonjour ${name},</h2>
          <p><strong>Attention</strong> — votre licence expire dans 7 jours (${payload.expiration_date}).</p>
          <p>Sans renouvellement, votre compte basculera en mode Freemium et certaines fonctionnalités seront désactivées.</p>
          <p>L'équipe Digal</p>
        `),
      };
    case "renouvellement":
      return {
        subject: "Licence Digal renouvelée ✅",
        html: wrapHtml(`
          <h2>Bonne nouvelle, ${name} !</h2>
          <p>Votre licence <strong>${payload.plan ?? "Digal"}</strong> a été renouvelée avec succès.</p>
          <p>Nouvelle date d'expiration : <strong>${payload.expiration_date}</strong>.</p>
          <p>L'équipe Digal</p>
        `),
      };
    case "rejet_createur":
      return {
        subject: "Votre contenu n'a pas été validé",
        html: wrapHtml(`
          <h2>Bonjour ${name},</h2>
          <p>Votre contenu soumis pour validation n'a pas été accepté.</p>
          ${payload.commentaire ? `<p><strong>Motif :</strong> ${payload.commentaire}</p>` : ""}
          <p>N'hésitez pas à soumettre une nouvelle version en tenant compte de ce retour.</p>
          <p>L'équipe Digal</p>
        `),
      };
    case "waitlist_approuve":
      return {
        subject: "Votre accès Digal est confirmé 🎉",
        html: wrapHtml(`
          <h2>Bonne nouvelle, ${name} !</h2>
          <p>Votre demande d'accès à Digal a été approuvée. Vous pouvez dès maintenant vous connecter et commencer à utiliser la plateforme.</p>
          ${payload.lien_preview ? `<p><a href="${payload.lien_preview}" style="background:#c4522a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Accéder à Digal</a></p>` : ""}
          <p>L'équipe Digal</p>
        `),
      };
    case "preview_expire":
      return {
        subject: "Le lien de prévisualisation a expiré",
        html: wrapHtml(`
          <h2>Bonjour ${name},</h2>
          <p>Le lien de prévisualisation partagé avec <strong>${payload.nom_client ?? "votre client"}</strong> a expiré.</p>
          <p>Vous pouvez en générer un nouveau depuis la fiche client dans Digal.</p>
          <p>L'équipe Digal</p>
        `),
      };
    case "activation":
      return {
        subject: "Votre accès Digal est prêt !",
        html: wrapHtml(`
          <h2>Bonjour ${name} !</h2>
          <p>Votre demande d'accès Digal en tant que <strong>${payload.type_compte_label ?? "utilisateur"}</strong> a été approuvée.</p>
          <p>Cliquez sur le bouton ci-dessous pour activer votre compte et choisir votre mot de passe :</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${payload.activation_link ?? "#"}" style="background:#c4522a;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Activer mon compte →</a>
          </p>
          <p style="font-size:12px;color:#999;">Ce lien est valable 48 heures. Si vous n'avez pas demandé cet accès, ignorez cet email.</p>
          <p>L'équipe Digal</p>
        `),
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
