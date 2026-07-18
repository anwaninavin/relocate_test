// Bump this whenever sw.js itself changes — combined with the activate handler below, that's
// what evicts stale cache entries for anyone with an already-installed service worker.
const CACHE_NAME = "pack-with-me-shell-v3";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// The HTML shell (navigations, and index.html/the manifest directly) must always be fetched
// network-first: serving it cache-first can hand back a PREVIOUS deploy's index.html, which
// references that build's content-hashed JS/CSS filenames — files the server has since deleted
// after the next deploy overwrites dist/assets. That's the "white screen after every deploy
// until a hard refresh" failure mode, since the stale shell's own script tags then 404. Hashed
// static assets (everything else here) are safe to serve cache-first: their filename changes
// whenever their content does, so a stale cache entry for an old hash is harmless — the current
// index.html simply never references that old filename again.
function isAppShellRequest(request, url) {
  return request.mode === "navigate" || url.pathname === "/index.html" || url.pathname === "/manifest.webmanifest";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API calls. Every /api/ response is dynamic and per-user (checklist state,
  // dashboard counts, etc.) — the cache-first strategy below is fine for hashed static assets,
  // but applying it here means a GET fired right after a PATCH/POST can be answered from a
  // cache entry that's minutes old (since the only thing that revalidates it is another GET
  // to that exact URL), silently undoing the mutation's optimistic UI update. The app's own
  // fetch layer (frontend/src/lib/api.ts) already sets `cache: "no-store"` specifically to
  // prevent this; a Service Worker sits below that and must not reintroduce it.
  if (url.pathname.startsWith("/api/")) return;

  if (isAppShellRequest(request, url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);

      if (cached) return cached;

      return fetchPromise.catch(() => caches.match("/index.html"));
    })
  );
});
