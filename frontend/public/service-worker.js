/* BizReels — minimal service worker: cache-first for app shell, network-first for API. */
const APP_SHELL = "bizreels-shell-v1";
const API_CACHE = "bizreels-api-v1";
const OFFLINE_PATH = "/offline.html";

const SHELL_ASSETS = ["/", "/index.html", "/manifest.json", OFFLINE_PATH];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== APP_SHELL && k !== API_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // API: network-first, cache 5 min
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(API_CACHE).then((c) => c.put(req, clone)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((c) => c || new Response(JSON.stringify({error:"offline"}), {status: 503, headers: {"Content-Type":"application/json"}})))
    );
    return;
  }

  // Navigation: try network, fallback to cached shell then offline page
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/").then((c) => c || caches.match(OFFLINE_PATH)))
    );
    return;
  }

  // Static: cache-first
  event.respondWith(
    caches.match(req).then((c) => c || fetch(req).then((res) => {
      const clone = res.clone();
      caches.open(APP_SHELL).then((cache) => cache.put(req, clone)).catch(() => {});
      return res;
    }).catch(() => new Response("", {status: 504})))
  );
});
