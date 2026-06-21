// Casa Corona service worker — push notifications + offline shell.
// Public URL: /sw.js (Vite copies public/* to dist root).

self.addEventListener("install", (event) => {
  // Activate the new SW immediately on first install
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of all open clients without waiting for reload
  event.waitUntil(self.clients.claim());
});

// ── Push event ──────────────────────────────────────────────────────────────
// Payload is JSON: { title, body, url?, icon? }
self.addEventListener("push", (event) => {
  let data = { title: "Casa Corona", body: "You have a new update", url: "/" };
  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }
  const options = {
    body: data.body,
    icon: data.icon || "/logo.png",
    badge: "/logo.png",
    data: { url: data.url || "/" },
    tag: data.tag || "casacorona",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ── Notification click ──────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if (c.url.includes(url)) return c.focus();
      }
      return self.clients.openWindow(url);
    })()
  );
});

// ── Offline shell (very small fallback) ───────────────────────────────────
self.addEventListener("fetch", (event) => {
  // Only handle GET requests; ignore cross-origin, API, and socket requests.
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/uploads/")) return;
  if (url.pathname.startsWith("/socket.io/")) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        return fresh;
      } catch {
        // Return offline.html when network fails
        const cache = await caches.open("casacorona-shell");
        const offline = await cache.match("/offline.html");
        if (offline) return offline;
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })()
  );
});

// Pre-cache the offline page on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("casacorona-shell").then((cache) => cache.add("/offline.html").catch(() => {}))
  );
});