const CACHE = "dinopay-v1";
const STATIC = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(STATIC.filter(Boolean))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle same-origin GET requests for static assets
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Skip Next.js internal routes, API routes, and server-rendered pages
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin/") ||
    url.pathname.startsWith("/unidad/") ||
    url.pathname === "/login"
  ) {
    // For _next/static, use cache-first
    if (url.pathname.startsWith("/_next/static/")) {
      e.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
            return res;
          });
        })
      );
    }
    return;
  }

  // For manifests and icons: cache-first
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      });
    })
  );
});
