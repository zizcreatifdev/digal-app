// Supabase Edge Function: scheduled-cleanup
// Cleans up expired preview links and old published post media.
// Also sends "expired without response" notification emails to CMs.
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Digal <onboarding@resend.dev>";
const APP_URL = "https://digal.vercel.app";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const results: string[] = [];
    const now = new Date().toISOString();

    // ── 1. Notify CM/DM about expired links with no client response ──────────
    //    Find links that: expired, still 'actif' status, not yet notified
    try {
      const { data: expiredUnnotified, error: notifErr } = await supabase
        .from("preview_links")
        .select("id, user_id, client_id, periode_debut, periode_fin")
        .eq("statut", "actif")
        .eq("expiry_notified", false)
        .lt("expires_at", now);

      if (notifErr) {
        results.push(`Preview notify: query error: ${notifErr.message}`);
      } else {
        let notified = 0;
        const notifiedIds: string[] = [];

        for (const link of (expiredUnnotified ?? []) as Array<{
          id: string; user_id: string; client_id: string;
          periode_debut: string; periode_fin: string;
        }>) {
          try {
            // Get CM email + prenom
            const { data: cmUser } = await supabase
              .from("users")
              .select("email, prenom")
              .eq("user_id", link.user_id)
              .maybeSingle();

            if (!cmUser?.email) continue;

            // Get client name
            const { data: client } = await supabase
              .from("clients")
              .select("nom")
              .eq("id", link.client_id)
              .maybeSingle();

            const clientName = (client as { nom?: string } | null)?.nom ?? "votre client";
            const cmPrenom = (cmUser as { prenom?: string }).prenom ?? "cher utilisateur";
            const periodDebut = new Date(link.periode_debut).toLocaleDateString("fr-FR");
            const periodFin = new Date(link.periode_fin).toLocaleDateString("fr-FR");
            const clientUrl = `${APP_URL}/dashboard/clients/${link.client_id}`;

            await resend.emails.send({
              from: FROM,
              to: [(cmUser as { email: string }).email],
              subject: "Lien de validation expiré sans réponse",
              html: wrapHtml(`
                <h2>Bonjour ${cmPrenom},</h2>
                <p>Le lien de validation partagé avec <strong>${clientName}</strong> pour la période du <strong>${periodDebut} au ${periodFin}</strong> a expiré sans réponse de votre client.</p>
                <p>Vous pouvez générer un nouveau lien directement depuis la fiche client.</p>
                <p style="text-align:center;margin:24px 0;">
                  <a href="${clientUrl}" style="background:#c4522a;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Générer un nouveau lien →</a>
                </p>
                <p>L'équipe Digal</p>
              `),
            });

            notified++;
            notifiedIds.push(link.id);
          } catch (emailErr) {
            console.warn(`[scheduled-cleanup] notify email failed for link ${link.id}:`, emailErr);
          }
        }

        // Mark expiry_notified = true for successfully notified links
        if (notifiedIds.length > 0) {
          await supabase
            .from("preview_links")
            .update({ expiry_notified: true })
            .in("id", notifiedIds)
            .then(() => {/* ok */})
            .catch((e: Error) => console.warn("[scheduled-cleanup] expiry_notified update failed:", e.message));
        }

        results.push(`Preview expiry notifications: ${notified} email(s) sent`);
      }
    } catch (notifEx) {
      results.push(`Preview notify: exception: ${String(notifEx)}`);
    }

    // ── 2. Mark expired actif preview links as 'expire' ──────────────────────
    const { data: expiredLinks, error: expErr } = await supabase
      .from("preview_links")
      .update({ statut: "expire" })
      .eq("statut", "actif")
      .lt("expires_at", now)
      .select("id");

    if (!expErr) {
      results.push(`Preview links marked expired: ${expiredLinks?.length ?? 0}`);
    }

    // ── 3. Delete media of published posts older than 1 day ──────────────────
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: publishedPosts, error: pubErr } = await supabase
      .from("posts")
      .select("id, media_url")
      .eq("statut", "publie")
      .not("media_url", "is", null)
      .lt("updated_at", yesterday.toISOString());

    if (!pubErr && publishedPosts) {
      for (const post of publishedPosts as Array<{ id: string; media_url: string | null }>) {
        if (post.media_url) {
          const path = post.media_url.split("/post-media/")[1];
          if (path) {
            await supabase.storage.from("post-media").remove([decodeURIComponent(path)]);
          }
          await supabase.from("posts").update({ media_url: null }).eq("id", post.id);
        }
      }
      results.push(`Published post media cleaned: ${publishedPosts.length}`);
    }

    return new Response(
      JSON.stringify({ success: true, results, timestamp: now }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[scheduled-cleanup]", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
