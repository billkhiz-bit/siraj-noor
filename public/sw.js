// Siraj Noor service worker
//
// Strategy:
//   - Precache the app shell (landing, dashboard, activity, bookmarks,
//     collections) on install so the core navigation works offline.
//   - Cache-first for Next.js static assets (/_next/static/*) since they
//     are content-hashed and safe to serve from cache indefinitely.
//   - Network-first with cache fallback for HTML navigations, so users
//     always get the freshest build when online and a usable screen when
//     offline.
//   - Never cache the Quran Foundation API or the QF OAuth proxy - those
//     responses are user-scoped and auth-dependent.
//
// Version bumping: increment CACHE_VERSION whenever the precache list or
// the caching strategy changes. The activate handler deletes any cache
// whose name doesn't match, so the previous version is garbage-collected
// on the first activation after deploy.

// Bumped to v2 after the Zod schema fixes so service worker users
// that have the old bundle cached get a fresh app shell on next
// visit. The activate handler below deletes any cache whose name
// doesn't match CACHE_NAME, so the old v1 cache is garbage-
// collected on first activation after deploy.
const CACHE_VERSION = "v3";
const CACHE_NAME = `siraj-noor-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/dashboard/",
  "/activity/",
  "/bookmarks/",
  "/collections/",
  "/icon.svg",
  "/icon-maskable.svg",
  "/manifest.webmanifest",
];

// Origins we explicitly refuse to cache. User-scoped or auth-sensitive.
const NO_CACHE_HOSTS = new Set([
  "apis.quran.foundation",
  "apis-prelive.quran.foundation",
  "prelive-oauth2.quran.foundation",
  "oauth2.quran.foundation",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // addAll fails the whole precache if any one request errors.
      // Add URLs individually so a single 404 or transient failure
      // doesn't block the install.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn("[SW] precache skipped:", url, err);
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Refuse to touch auth or user-scoped origins.
  if (NO_CACHE_HOSTS.has(url.hostname)) return;

  // Our own OAuth token proxy routes - never cache.
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    return;
  }

  // OAuth callback URLs carry single-use `code` + `state` query params.
  // Caching them risks stashing those secrets in the Cache Storage API
  // where a compromised extension or XSS sink could later read them.
  // Let the browser handle these navigations directly.
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith("/auth/callback")
  ) {
    return;
  }

  // Only take over same-origin requests; leave cross-origin to the browser.
  if (url.origin !== self.location.origin) return;

  // Cache-first for Next.js static chunks (content-hashed, immutable).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for HTML navigations.
  if (
    request.mode === "navigate" ||
    request.headers.get("Accept")?.includes("text/html")
  ) {
    event.respondWith(networkFirst(request));
    return;
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    // No cached copy and network failed - let the browser surface
    // the real network error to the caller.
    throw err;
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Last-resort fallback: the landing page, which is always
    // precached. Gives the user something usable instead of a
    // browser-chrome offline error screen.
    const landing = await cache.match("/");
    if (landing) return landing;
    return Response.error();
  }
}
