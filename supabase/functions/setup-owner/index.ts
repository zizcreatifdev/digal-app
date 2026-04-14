import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if setup already done
    const { data: setting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "owner_setup_done")
      .maybeSingle();

    if (setting?.value === "true") {
      return new Response(
        JSON.stringify({ error: "Le compte Owner a déjà été créé." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = "ziza@digal.sn";
    const password = "Admin123!";

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // Insert profile in users table
    await supabase.from("users").insert({
      user_id: userId,
      email,
      prenom: "Owner",
      nom: "Digal",
      role: "owner",
      plan: "owner",
      agence_nom: "Digal",
    });

    // Insert admin role in user_roles
    await supabase.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });

    // Mark setup as done
    await supabase.from("site_settings").insert({
      key: "owner_setup_done",
      value: "true",
      created_by: userId,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Compte Owner créé avec succès." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
