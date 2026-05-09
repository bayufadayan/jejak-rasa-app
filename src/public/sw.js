// Simple caching strategies without external dependencies
const CACHE_NAMES = {
  google_fonts: 'google-fonts-v1',
  fontawesome: 'fontawesome-v1',
  avatars: 'avatars-api-v1',
  story_api: 'story-api-v1',
  story_images: 'story-api-images-v1',
  maptiler: 'maptiler-api-v1',
};

// Placeholder used by vite-plugin-pwa injectManifest during production build.
const manifest = self.__WB_MANIFEST;

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cached || new Response('Offline', { status: 503 });
  }
}

// Network First strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    return cache.match(request) || new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

// Install event: Cache essential files
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !Object.values(CACHE_NAMES).includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Route requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Google Fonts - Cache First
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    return event.respondWith(cacheFirst(request, CACHE_NAMES.google_fonts));
  }

  // Font Awesome - Cache First
  if (url.origin === 'https://cdnjs.cloudflare.com' || url.origin.includes('fontawesome')) {
    return event.respondWith(cacheFirst(request, CACHE_NAMES.fontawesome));
  }

  // UI Avatars - Cache First
  if (url.origin === 'https://ui-avatars.com') {
    return event.respondWith(cacheFirst(request, CACHE_NAMES.avatars));
  }

  // Story API (non-image) - Network First
  if (url.origin.includes('story-api.dicoding.dev') && request.destination !== 'image') {
    return event.respondWith(networkFirst(request, CACHE_NAMES.story_api));
  }

  // Story API Images - Stale While Revalidate
  if (url.origin.includes('story-api.dicoding.dev') && request.destination === 'image') {
    return event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.story_images));
  }

  // MapTiler - Cache First
  if (url.origin.includes('maptiler')) {
    return event.respondWith(cacheFirst(request, CACHE_NAMES.maptiler));
  }
});

self.addEventListener('push', (event) => {
  const showNotification = async () => {
    let payload = {};

    if (event.data) {
      try {
        payload = await event.data.json();
      } catch (error) {
        const text = await event.data.text();
        payload = {
          title: 'Jejak Rasa',
          options: {
            body: text,
            data: {},
          },
        };
      }
    }

    const title = payload.title || 'Jejak Rasa';
    const options = payload.options || {};
    const data = options.data || {};

    await self.registration.showNotification(title, {
      body: options.body || 'Ada cerita baru untuk Anda.',
      icon: options.icon || '/images/logo-jejak-rasa.png',
      badge: '/images/icons/maskable-icon-x48.png',
      data,
      tag: data.id ? `story-${data.id}` : 'story-update',
      actions: [
        {
          action: 'open-story',
          title: 'Lihat detail',
        },
      ],
    });
  };

  event.waitUntil(showNotification());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const storyId = data.id;
  const targetUrl = storyId ? `/#/story/${storyId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl)) {
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    }),
  );
});
