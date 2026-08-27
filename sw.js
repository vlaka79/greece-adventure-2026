/* Minimal service worker — installability only; no aggressive caching. */
self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  // Network-only: do not intercept or cache site assets.
});
