import { useState, useEffect } from 'react';

export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      setIsSupported(true);
      
      // Register service worker
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })
        .then((reg) => {
          console.log('SW registered: ', reg);
          setRegistration(reg);
          setIsRegistered(true);
          
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update prompt
                  console.log('New service worker available');
                  // You can show an update prompt here
                }
              });
            }
          });

          // Handle controller change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service worker controller changed');
            window.location.reload();
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  };

  const sendTestNotification = () => {
    if (notificationPermission === 'granted') {
      new Notification('CRM Test Notification', {
        body: 'This is a test notification from your CRM app',
        icon: '/image.png',
        badge: '/image.png',
        tag: 'test-notification'
      });
    }
  };

  const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported');
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      
      // Request notification permission
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push notifications
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      });

      console.log('Push notification subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  };

  const checkForUpdates = async () => {
    if (registration) {
      try {
        await registration.update();
        console.log('Checking for updates...');
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    }
  };

  const skipWaiting = async () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    isSupported,
    isRegistered,
    notificationPermission,
    registration,
    requestNotificationPermission,
    sendTestNotification,
    subscribeToPushNotifications,
    checkForUpdates,
    skipWaiting
  };
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
