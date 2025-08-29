"use client";

import React from "react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-navigation-bar";
import MobileNavBar from "@/components/mobile-nav-bar";
import PWAInstallPrompt from "./installation-prompt";

type TDashboardLayoutProps = {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: TDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Navigation - Always present but hidden on larger screens via CSS */}
      <MobileNavBar />
      
      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] min-h-screen">
        {/* Sidebar - Hidden on mobile, visible on xl+ */}
        <div className="hidden xl:block">
          <Sidebar />
        </div>
        
        {/* Main Content Area */}
        <div className="flex flex-col">
          {/* Top Bar - Hidden on mobile, visible on xl+ */}
          <div className="hidden xl:block">
            <TopBar />
          </div>
          
          {/* Main Content - Add top padding for mobile navigation */}
          <main className="flex-1 p-4 xl:p-6 overflow-auto xl:pt-6">
            {children}
          </main>
          
          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
        </div>
      </div>
    </div>
  );
}
