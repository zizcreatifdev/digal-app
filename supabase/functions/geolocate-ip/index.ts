// Supabase Edge Function: geolocate-ip
// Called after login_success to enrich activity_logs with city/country.
// Uses ip-api.com (HTTP, free, no API key required).
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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

    const { logId } = await req.json();
    if (!logId) {
      return new Response(
        JSON.stringify({ error: "logId requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retrieve the log entry to get its IP address
    const { data: log, error: logError } = await supabase
      .from("activity_logs")
      .select("ip_address")
      .eq("id", logId)
      .single();

    if (logError || !log?.ip_address) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "IP introuvable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ip-api.com — HTTP uniquement, gratuit, sans clé API
    const geoRes = await fetch(
      `http://ip-api.com/json/${log.ip_address}?fields=status,city,country,countryCode`
    );
    const geo = await geoRes.json();

    if (geo.status !== "success") {
      return new Response(
        JSON.stringify({ skipped: true, reason: geo.message ?? "Géolocalisation échouée" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("activity_logs")
      .update({
        city: geo.city ?? null,
        country: geo.country ?? null,
        country_code: geo.countryCode ?? null,
      })
      .eq("id", logId);

    return new Response(
      JSON.stringify({ success: true, city: geo.city, country: geo.country, countryCode: geo.countryCode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[geolocate-ip]", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
