import CONFIG from '../config.js';
import { subscribePushNotification, unsubscribePushNotification } from '../data/api.js';
import { convertBase64ToUint8Array, isServiceWorkerAvailable } from './index.js';

export function isNotificationAvailable() {
  return 'Notification' in window;
}

export function isNotificationGranted() {
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error('Notification API unsupported.');
    return false;
  }

  if (isNotificationGranted()) {
    return true;
  }

  const status = await Notification.requestPermission();

  if (status === 'denied') {
    alert('Izin notifikasi ditolak.');
    return false;
  }

  if (status === 'default') {
    alert('Izin notifikasi ditutup atau diabaikan.');
    return false;
  }

  return true;
}

export async function getPushSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

export async function isCurrentPushSubscriptionAvailable() {
  return !!(await getPushSubscription());
}

export function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
  };
}

export async function subscribe() {
  if (!isServiceWorkerAvailable()) {
    alert('Service worker tidak tersedia di browser ini.');
    return false;
  }

  if (!(await requestNotificationPermission())) {
    return false;
  }

  if (await isCurrentPushSubscriptionAvailable()) {
    alert('Sudah berlangganan push notification.');
    return true;
  }

  const failureSubscribeMessage = 'Langganan push notification gagal diaktifkan.';
  const successSubscribeMessage = 'Langganan push notification berhasil diaktifkan.';

  let pushSubscription = null;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      alert('Service worker belum terpasang.');
      return false;
    }

    pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());

    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await subscribePushNotification({ endpoint, keys });

    if (!response.ok) {
      console.error('subscribe: response:', response);
      alert(failureSubscribeMessage);
      await pushSubscription.unsubscribe();
      return false;
    }

    alert(successSubscribeMessage);
    return true;
  } catch (error) {
    console.error('subscribe: error:', error);
    alert(failureSubscribeMessage);

    if (pushSubscription) {
      await pushSubscription.unsubscribe();
    }

    return false;
  }
}

export async function unsubscribe() {
  const failureUnsubscribeMessage = 'Langganan push notification gagal dinonaktifkan.';
  const successUnsubscribeMessage = 'Langganan push notification berhasil dinonaktifkan.';

  try {
    const pushSubscription = await getPushSubscription();

    if (!pushSubscription) {
      alert('Belum berlangganan push notification.');
      return false;
    }

    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await unsubscribePushNotification({ endpoint });

    if (!response.ok) {
      alert(failureUnsubscribeMessage);
      console.error('unsubscribe: response:', response);
      return false;
    }

    const unsubscribed = await pushSubscription.unsubscribe();

    if (!unsubscribed) {
      alert(failureUnsubscribeMessage);
      await subscribePushNotification({ endpoint, keys });
      return false;
    }

    alert(successUnsubscribeMessage);
    return true;
  } catch (error) {
    alert(failureUnsubscribeMessage);
    console.error('unsubscribe: error:', error);
    return false;
  }
}
