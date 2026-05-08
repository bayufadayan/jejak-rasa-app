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
      badge: '/favicon.png',
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
