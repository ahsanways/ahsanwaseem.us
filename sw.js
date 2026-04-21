// Simple runtime cache for GitHub Pages static hosting.
// Helps Lighthouse "cache lifetimes" by caching immutable static assets locally.

const VERSION = "v1";
const RUNTIME = `runtime-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("runtime-") && k !== RUNTIME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isCacheable(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  // Only cache same-origin assets.
  if (url.origin !== self.location.origin) return false;

  // Cache Next static assets + common media types from /public.
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2?)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheable(request)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(request);
      if (cached) return cached;

      const resp = await fetch(request);
      // Cache successful, basic responses only.
      if (resp && resp.status === 200 && resp.type === "basic") {
        cache.put(request, resp.clone());
      }
      return resp;
    })()
  );
});

