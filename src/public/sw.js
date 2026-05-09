import { precacheAndRoute } from 'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-precaching.prod.mjs';
import { registerRoute } from 'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-routing.prod.mjs';
import { CacheableResponsePlugin } from 'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-cacheable-response.prod.mjs';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-strategies.prod.mjs';

// Do precaching
const manifest = self.__WB_MANIFEST;
if (manifest) {
  precacheAndRoute(manifest);
}

// Runtime caching
registerRoute(
  ({ url }) => {
    return url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com';
  },
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

registerRoute(
  ({ url }) => {
    return url.origin === 'https://cdnjs.cloudflare.com' || url.origin.includes('fontawesome');
  },
  new CacheFirst({
    cacheName: 'fontawesome',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

registerRoute(
  ({ url }) => {
    return url.origin === 'https://ui-avatars.com';
  },
  new CacheFirst({
    cacheName: 'avatars-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) => {
    return url.origin.includes('story-api.dicoding.dev') && request.destination !== 'image';
  },
  new NetworkFirst({
    cacheName: 'story-api',
  }),
);

registerRoute(
  ({ request, url }) => {
    return url.origin.includes('story-api.dicoding.dev') && request.destination === 'image';
  },
  new StaleWhileRevalidate({
    cacheName: 'story-api-images',
  }),
);

registerRoute(
  ({ url }) => {
    return url.origin.includes('maptiler');
  },
  new CacheFirst({
    cacheName: 'maptiler-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
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
