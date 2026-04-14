// Supabase Edge Function — create-user
// Creates a new user account from the Admin panel.
// Requires SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Plan = "freemium" | "solo_standard" | "agence_standard" | "agence_pro";

interface CreateUserPayload {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  plan: Plan;
  agence_nom?: string;
}

const PLAN_TO_ROLE: Record<Plan, string> = {
  freemium: "freemium",
  solo_standard: "solo",
  agence_standard: "agence_standard",
  agence_pro: "agence_pro",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // 1. Verify caller has owner role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await adminClient
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.role !== "owner" && profile?.role !== "dm") {
      return new Response(JSON.stringify({ error: "Accès réservé aux administrateurs" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate payload
    const body: CreateUserPayload = await req.json();
    const { prenom, nom, email, password, plan, agence_nom } = body;

    if (!prenom || !nom || !email || !password || !plan) {
      return new Response(JSON.stringify({ error: "Champs obligatoires manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Create Auth user (email already confirmed)
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
    const role = PLAN_TO_ROLE[plan] ?? "freemium";

    // 4. Licence expiry: +6 months for paid plans
    const licenceExpiration = plan !== "freemium"
      ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // 5. Insert profile in public.users
    const { error: profileError } = await adminClient.from("users").insert({
      user_id: userId,
      email,
      prenom,
      nom,
      role,
      plan,
      agence_nom: agence_nom || null,
      licence_expiration: licenceExpiration,
    });

    if (profileError) {
      // Rollback: remove Auth user to avoid orphan
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Insert entry in user_roles
    await adminClient.from("user_roles").insert({ user_id: userId, role: "user" });

    return new Response(
      JSON.stringify({ success: true, user_id: userId, email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
