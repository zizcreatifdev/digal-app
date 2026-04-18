// Supabase Edge Function: activate-account
// Validates an activation token and creates the user account.
// No auth required: the token itself acts as the credential.
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivatePayload {
  token: string;
  prenom: string;
  nom: string;
  agence_nom?: string;
  password: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body: ActivatePayload = await req.json();
    const { token, prenom, nom, agence_nom, password } = body;

    if (!token || !prenom || !nom || !password) {
      return new Response(JSON.stringify({ error: "Champs obligatoires manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch and validate token
    const { data: tokenRow, error: tokenErr } = await adminClient
      .from("activation_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (tokenErr || !tokenRow) {
      return new Response(JSON.stringify({ error: "Lien d'activation invalide." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tokenRow.is_used) {
      return new Response(JSON.stringify({ error: "Ce lien a déjà été utilisé." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Ce lien a expiré." }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, type_compte, agence_id } = tokenRow as typeof tokenRow & { agence_id?: string | null };

    // Determine role: team invites use type_compte directly (cm/createur)
    const TEAM_ROLES = ["cm", "createur"];
    const isTeamInvite = TEAM_ROLES.includes(type_compte);
    const userRole = isTeamInvite ? type_compte : "freemium";

    // 2. Create Auth user (confirmed: no email verification needed)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // 3. Insert profile in public.users
    const { error: profileError } = await adminClient.from("users").insert({
      user_id: userId,
      email,
      prenom,
      nom,
      role: userRole,
      plan: null,
      agence_nom: agence_nom || null,
      ...(isTeamInvite && agence_id ? { agence_id } : {}),
    });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Generate referral code
    const referralCode = "DIG" + Math.random().toString(36).toUpperCase().slice(2, 8);
    await adminClient.from("users").update({ referral_code: referralCode }).eq("user_id", userId).is("referral_code", null);

    // 5. Insert user_roles
    await adminClient.from("user_roles").insert({ user_id: userId, role: "user" });

    // 6. Mark token as used
    await adminClient
      .from("activation_tokens")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("token", token);

    return new Response(
      JSON.stringify({ success: true, email, type_compte }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
