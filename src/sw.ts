/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

declare const self: ServiceWorkerGlobalScope;

// Take control immediately
clientsClaim();

// Cleanup old caches from previous SW versions
cleanupOutdatedCaches();

// Precache all assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// --- Web Push notification handler ---
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let payload: { title?: string; body?: string; url?: string; icon?: string } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Digal", body: event.data.text() };
  }

  const title = payload.title ?? "Digal";
  const options: NotificationOptions = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url ?? "/" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Open the notification URL when clicked
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url: string = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});

// Background sync for offline actions (calendar reads are cached via workbox)
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
