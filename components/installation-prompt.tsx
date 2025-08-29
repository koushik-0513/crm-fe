'use client';

import { useState, useEffect } from 'react';
import { useServiceWorker } from '@/hooks/utils/use-service-worker';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  
  const {
    isSupported,
    isRegistered,
    notificationPermission,
    requestNotificationPermission,
    sendTestNotification,
    subscribeToPushNotifications,
    checkForUpdates
  } = useServiceWorker();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('Install prompt event fired');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('App was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is already installed');
        setCanInstall(false);
      }
    };

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check if already installed
    checkIfInstalled();

    // Show notification prompt after a delay if permission not granted
    const timer = setTimeout(() => {
      if (notificationPermission === 'default' && isRegistered && !canInstall) {
        setShowNotificationPrompt(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [notificationPermission, isRegistered, canInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
        setCanInstall(false);
      } else {
        console.log('User dismissed the install prompt');
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error during install:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  const handleNotificationPermission = async () => {
    try {
      await requestNotificationPermission();
      setShowNotificationPrompt(false);
      
      // Subscribe to push notifications
      await subscribeToPushNotifications();
    } catch (error) {
      console.error('Failed to get notification permission:', error);
    }
  };

  const handleDismissNotification = () => {
    setShowNotificationPrompt(false);
  };

  const handleTestNotification = () => {
    sendTestNotification();
  };

  const handleCheckUpdates = () => {
    checkForUpdates();
  };

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && canInstall && (
        <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Install CRM App</h3>
                <p className="text-sm text-gray-600">Add to home screen for quick access</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleDismiss}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Not now
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4 py-1 text-sm bg-black text-white rounded-md hover:bg-gray-800"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <div className="fixed bottom-20 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Enable Notifications</h3>
                <p className="text-sm text-gray-600">Get notified about important updates</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleDismissNotification}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Later
              </button>
              <button
                onClick={handleNotificationPermission}
                className="px-4 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Status Indicator (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white text-xs p-2 rounded z-50">
          <div>SW: {isSupported ? '✓' : '✗'}</div>
          <div>Reg: {isRegistered ? '✓' : '✗'}</div>
          <div>Notif: {String(notificationPermission)}</div>
          <div>Can Install: {canInstall ? '✓' : '✗'}</div>
          {notificationPermission === 'granted' && (
            <button
              onClick={handleTestNotification}
              className="mt-1 px-2 py-1 bg-green-600 text-white rounded text-xs w-full"
            >
              Test Notif
            </button>
          )}
          <button
            onClick={handleCheckUpdates}
            className="mt-1 px-2 py-1 bg-blue-600 text-white rounded text-xs w-full"
          >
            Check Updates
          </button>
        </div>
      )}
    </>
  );
}
