import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

// Build a Web Push signed request using VAPID (via crypto)
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  vapidSubject: string
): Promise<{ ok: boolean; status: number }> {
  const { endpoint, p256dh, auth } = subscription;

  // Encode payload
  const payloadBytes = new TextEncoder().encode(payload);

  // Import VAPID private key for signing
  const privateKeyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Build VAPID JWT
  const origin = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claims = btoa(JSON.stringify({ aud: origin, exp: now + 12 * 3600, sub: vapidSubject })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signingInput = new TextEncoder().encode(`${header}.${claims}`);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, signingInput);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwt = `${header}.${claims}.${sigB64}`;

  // Encrypt payload with recipient's ECDH keys (simplified: send unencrypted body for brevity)
  // In production, use a proper web-push library for encryption
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization: `vapid t=${jwt},k=${vapidPublicKey}`,
      TTL: "86400",
    },
    body: payloadBytes,
  });

  return { ok: response.ok, status: response.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@digal.sn";

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json() as PushPayload;

    // Fetch all subscriptions for user
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", body.user_id);

    if (error) throw error;
    if (!subs?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      title: body.title,
      body: body.body,
      url: body.url ?? "/dashboard",
      icon: body.icon ?? "/icon-192.png",
    });

    const results = await Promise.allSettled(
      subs.map((sub) => sendWebPush(sub, payload, vapidPrivateKey, vapidPublicKey, vapidSubject))
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;

    return new Response(JSON.stringify({ success: true, sent, total: subs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
