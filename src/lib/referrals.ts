import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/lib/notifications";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ── Reward referrer with free months ─────────────────────────────────────────
export async function rewardReferrer(referrerAuthId: string, monthsToAdd: number): Promise<void> {
  try {
    const { data: referrer } = await db
      .from("users")
      .select("role, licence_expiration, referral_months_earned, referral_months_used")
      .eq("user_id", referrerAuthId)
      .maybeSingle();

    if (!referrer) return;

    const earned = (referrer.referral_months_earned ?? 0) + monthsToAdd;

    if (referrer.role === "freemium") {
      await db.from("users").update({ referral_months_earned: earned }).eq("user_id", referrerAuthId);

      await createNotification(
        referrerAuthId,
        "Mois de parrainage gagnés",
        `Vous avez gagné ${monthsToAdd} mois ! Ils seront appliqués à votre prochaine licence.`,
        "success",
      );
    } else {
      const base = referrer.licence_expiration ? new Date(referrer.licence_expiration) : new Date();
      base.setMonth(base.getMonth() + monthsToAdd);
      const used = (referrer.referral_months_used ?? 0) + monthsToAdd;

      await db.from("users").update({
        licence_expiration: base.toISOString(),
        referral_months_earned: earned,
        referral_months_used: used,
      }).eq("user_id", referrerAuthId);

      await createNotification(
        referrerAuthId,
        "Licence prolongée",
        `${monthsToAdd} mois offerts ajoutés à votre licence ! Nouvelle expiration : ${base.toLocaleDateString("fr-FR")}.`,
        "success",
      );
    }
  } catch (err) {
    console.error("[rewardReferrer]", err);
  }
}

// ── Check if a newly-paid user qualifies their referrer for a reward ─────────
export async function checkReferralQualification(userAuthId: string, newPlan: string): Promise<void> {
  if (!newPlan || newPlan === "freemium") return;
  try {
    const { data: user } = await db
      .from("users")
      .select("referred_by")
      .eq("user_id", userAuthId)
      .maybeSingle();

    if (!user?.referred_by) return;
    const referrerAuthId: string = user.referred_by;

    // Skip if referral already qualified/rewarded
    const { data: existing } = await db
      .from("referrals")
      .select("id, status")
      .eq("referee_id", userAuthId)
      .maybeSingle();

    if (existing?.status === "qualified" || existing?.status === "rewarded") return;

    const now = new Date().toISOString();

    if (existing) {
      await db.from("referrals").update({
        status: "qualified",
        plan_referee: newPlan,
        qualified_at: now,
      }).eq("id", existing.id);
    } else {
      await db.from("referrals").insert({
        referrer_id: referrerAuthId,
        referee_id: userAuthId,
        status: "qualified",
        plan_referee: newPlan,
        qualified_at: now,
      });
    }

    // Increment referrer's referral_count
    const { data: referrer } = await db
      .from("users")
      .select("referral_count")
      .eq("user_id", referrerAuthId)
      .maybeSingle();

    if (!referrer) return;
    const newCount = (referrer.referral_count ?? 0) + 1;
    await db.from("users").update({ referral_count: newCount }).eq("user_id", referrerAuthId);

    // Load tiers from site_settings
    const { data: tierSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "referral_tiers")
      .maybeSingle();

    let monthsToAdd = 0;
    if (tierSetting?.value) {
      try {
        const tiers = JSON.parse(tierSetting.value as string) as Record<string, number>;
        const hit = tiers[String(newCount)];
        if (hit) monthsToAdd = hit;
      } catch {
        // malformed JSON — skip
      }
    }

    if (monthsToAdd > 0) {
      await rewardReferrer(referrerAuthId, monthsToAdd);
    }
  } catch (err) {
    console.error("[checkReferralQualification]", err);
  }
}

// ── Apply stocked referral months to the user's own licence ──────────────────
export async function applyReferralMonths(userAuthId: string): Promise<number> {
  try {
    const { data: user } = await db
      .from("users")
      .select("referral_months_earned, referral_months_used, licence_expiration")
      .eq("user_id", userAuthId)
      .maybeSingle();

    if (!user) return 0;

    const stock = (user.referral_months_earned ?? 0) - (user.referral_months_used ?? 0);
    if (stock <= 0) return 0;

    const base = user.licence_expiration ? new Date(user.licence_expiration) : new Date();
    base.setMonth(base.getMonth() + stock);

    await db.from("users").update({
      licence_expiration: base.toISOString(),
      referral_months_used: (user.referral_months_used ?? 0) + stock,
    }).eq("user_id", userAuthId);

    await createNotification(
      userAuthId,
      "Mois de parrainage appliqués",
      `Vos ${stock} mois de parrainage ont été automatiquement appliqués !`,
      "success",
    );

    return stock;
  } catch (err) {
    console.error("[applyReferralMonths]", err);
    return 0;
  }
}

// ── Request additional referral quota ────────────────────────────────────────
export async function requestQuota(userAuthId: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const { data: existing } = await db
      .from("referral_quota_requests")
      .select("id")
      .eq("user_id", userAuthId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) return { error: "Une demande est déjà en cours de traitement." };

    const { data: user } = await db
      .from("users")
      .select("referral_quota")
      .eq("user_id", userAuthId)
      .maybeSingle();

    if (!user) return { error: "Utilisateur introuvable." };
    if ((user.referral_quota ?? 0) >= 6) return { error: "Votre quota maximum est atteint." };

    const autoApproveAt = new Date();
    autoApproveAt.setHours(autoApproveAt.getHours() + 1);

    const { error: insertErr } = await db.from("referral_quota_requests").insert({
      user_id: userAuthId,
      requested_quota: 3,
      status: "pending",
      auto_approve_at: autoApproveAt.toISOString(),
    });

    if (insertErr) return { error: insertErr.message };

    // Notify owner (fire-and-forget)
    const { data: owner } = await db
      .from("users")
      .select("user_id")
      .eq("role", "owner")
      .maybeSingle();

    if (owner?.user_id) {
      try {
        await createNotification(
          owner.user_id,
          "Demande de quota parrainage",
          "Un utilisateur demande 3 invitations supplémentaires.",
          "info",
        );
      } catch {
        // silent — owner notification is non-critical
      }
    }

    return { success: true };
  } catch (err) {
    console.error("[requestQuota]", err);
    return { error: "Une erreur est survenue." };
  }
}
