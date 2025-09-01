'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, Download, Wifi } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';
import { usePushNotifications } from '@/lib/push-notifications';

export function PWASettings() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { requestPermission, subscribe, showNotification } = usePushNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setNotificationsEnabled(Notification.permission === 'granted');

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      console.log('App installed successfully');
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestPermission();
      if (hasPermission) {
        await subscribe();
        setNotificationsEnabled(true);
        await showNotification('Notifications enabled!', {
          body: 'You will now receive notifications from the CRM app.',
        });
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const testNotification = async () => {
    await showNotification('Test Notification', {
      body: 'This is a test notification from your CRM app.',
      tag: 'test-notification',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            App Installation
          </CardTitle>
          <CardDescription>
            Install the CRM app for a better experience with offline access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isInstalled ? (
            <div className="flex items-center gap-2 text-green-600">
              <div className="h-2 w-2 bg-green-600 rounded-full"></div>
              App is installed
            </div>
          ) : isInstallable ? (
            <Button onClick={handleInstall} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          ) : (
            <p className="text-sm text-gray-600">
              App installation is not available in this browser.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications about important CRM updates and activities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Enable notifications</span>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
          
          {notificationsEnabled && (
            <Button
              variant="outline"
              onClick={testNotification}
              className="w-full"
            >
              Test Notification
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Your current connection status and offline capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}></div>
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {isOnline 
              ? 'All features are available.' 
              : 'Limited functionality available. Some features may not work until you reconnect.'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
