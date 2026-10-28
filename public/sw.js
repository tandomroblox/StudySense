const CACHE_NAME = "studysense-shell-v3";
const APP_SHELL = [
  "/", "/index.html", "/style.css", "/script.js", "/syllabus.js",
  "/study-tools.css", "/study-tools.js", "/manifest.webmanifest", "/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    await Promise.all(APP_SHELL.map(async path => {
      try {
        const response = await fetch(path, { cache: "reload" });
        if (response.ok && response.type !== "opaque") await cache.put(path, response);
      } catch (_) {
        // Keep other shell resources available when one optional asset fails.
      }
    }));
  }));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("studysense-shell-") && key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  // Never cache API requests, authenticated responses, or non-GET requests.
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith(
    fetch(request).then(response => {
      if (response.ok && APP_SHELL.includes(url.pathname)) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") return (await caches.match("/index.html")) || Response.error();
      return Response.error();
    })
  );
});
