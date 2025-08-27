import "./global.css"
import React from "react";
import { Suspense } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import Provider from "./provider";
import { Toaster } from "sonner";

type TRootLayoutProps = {
  children: React.ReactNode;
}

export default function RootLayout({ children }: TRootLayoutProps) {
  return (
    <html lang="en">
      <body>
          <AuthProvider>
            <Provider>
              <Toaster richColors position="top-right"/>
              {children}
            </Provider>
          </AuthProvider>
      </body>
    </html>
  );
}
