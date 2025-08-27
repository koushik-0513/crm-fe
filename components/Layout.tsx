"use client";

import React from "react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-navigation-bar";

type TDashboardLayoutProps = {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: TDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
