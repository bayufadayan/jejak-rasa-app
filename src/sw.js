import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

clientsClaim();

const precacheManifest = Array.isArray(self.__WB_MANIFEST) ? self.__WB_MANIFEST : [];

precacheAndRoute(precacheManifest);
cleanupOutdatedCaches();

const appShellHandler = async () => {
  const cachedShell = await caches.match('/index.html', { ignoreSearch: true });
  if (cachedShell) {
    return cachedShell;
  }

  try {
    return await fetch('/index.html');
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
};

registerRoute(new NavigationRoute(appShellHandler));

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
);

registerRoute(
  ({ url }) => url.origin === 'https://cdnjs.cloudflare.com' || url.origin.includes('fontawesome'),
  new CacheFirst({
    cacheName: 'fontawesome',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
);

registerRoute(
  ({ url }) => url.origin === 'https://ui-avatars.com',
  new CacheFirst({
    cacheName: 'ui-avatars',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
);

registerRoute(
  ({ url, request }) => url.origin.includes('story-api.dicoding.dev') && request.method === 'GET' && request.destination !== 'image',
  new NetworkFirst({
    cacheName: 'story-api',
    networkTimeoutSeconds: 3,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
);

registerRoute(
  ({ url, request }) => url.origin.includes('story-api.dicoding.dev') && request.method === 'GET' && request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'story-api-images',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
);

registerRoute(
  ({ url }) => url.origin.includes('maptiler'),
  new CacheFirst({
    cacheName: 'maptiler',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
);

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