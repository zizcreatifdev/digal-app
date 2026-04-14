import { supabase } from "@/integrations/supabase/client";

// VAPID public key (set this in your .env as VITE_VAPID_PUBLIC_KEY)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Returns true if Web Push is supported in this browser */
export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Current notification permission state */
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission;
}

/**
 * Ask the user for notification permission and subscribe them to push.
 * Saves the subscription endpoint to Supabase for the current user.
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) return false;
  if (!VAPID_PUBLIC_KEY) {
    console.warn("[Push] VITE_VAPID_PUBLIC_KEY not configured.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const json = subscription.toJSON();
  const { endpoint, keys } = json;
  if (!endpoint || !keys?.p256dh || !keys?.auth) return false;

  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    { onConflict: "user_id, endpoint" }
  );

  if (error) {
    console.error("[Push] Failed to save subscription:", error);
    return false;
  }

  return true;
}

/**
 * Unsubscribe from push notifications and remove from Supabase.
 */
export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);
  }
}

/**
 * Check if the current user is subscribed to push notifications.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}
