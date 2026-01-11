// next-pwa configuration - service worker is auto-generated
// This file contains additional service worker configuration

// Clear old caches when service worker updates
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [
    "api-cache",
    "static-resources",
    "image-cache",
    "html-cache",
  ];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle API requests with auth token preservation
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests - preserve auth cookies
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request.clone())
        .then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open("api-cache").then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Serve cached response on network error
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // If no cache and offline, return offline page
            if (request.mode === "navigate") {
              return caches.match("/offline");
            }
            return new Response("Offline - Resource not available", {
              status: 503,
              statusText: "Service Unavailable",
            });
          });
        })
    );
  }
});

// Handle periodic sync for background updates
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-expenses") {
    event.waitUntil(
      // Sync expenses data when online
      fetch("/api/expenses?month=" + new Date().toISOString().slice(0, 7), {
        credentials: "include",
      }).catch(() => {
        // Silently fail if offline
      })
    );
  }
});

// Handle push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || "You have a new notification",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: data.tag || "notification",
      requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(data.title || "Budget Tracker", options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (let client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
