import "./global.css"
import React from "react";
import { AuthProvider } from "@/contexts/auth-context";
import Provider from "./provider";
import { Toaster } from "sonner";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";

type TRootLayoutProps = {
  children: React.ReactNode;
}

export default function RootLayout({ children }: TRootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#736FC3" />
        <meta name="description" content="CRM Application - Manage your contacts and activities efficiently" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/image.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/image.png" />
        <link rel="apple-touch-icon" href="/image.png" />
        
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CRM" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Prevent zoom on mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
          <AuthProvider>
            <Provider>
              <Toaster richColors position="top-right"/>
              {children}
              <PWAInstallPrompt />
              <OfflineIndicator />
            </Provider>
          </AuthProvider>
      </body>
    </html>
  );
}
