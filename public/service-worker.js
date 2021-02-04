const { response } = require("express");

const FILES_TO_CACHE = [
  "/",
  "db.js",
  "/index.html",
  "/index.js",
  "/styles.css",
  "/manifest.webmanifest",
  "/public/icons/icon-192x192",
  "/public/icons/icon-512x512",
];

const CACHE_NAME = "static-cache-v1",
  DATA_CACHE_NAME = "data-cache-v1";

//Service Worker -- Installation
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("FILES WERE SUCCESSFULLY PRE-CACHED");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

//Service Worker -- Activation
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("REMOVING OLD CACHE DATA", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Adds an EVENT LISTENER to Service Worker when the fetch is ran
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api")) {
    console.log("[SERVICE WORKER] FETCH (data)", e.request.url);

    e.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(e.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(e.request.url, response.clone());
            }
            return response;
          })
          .catch((err) => {
            return cache.match(e.request);
          });
      })
    );
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((response) => {
        return response || fetch(e.request);
      });
    })
  );
});
