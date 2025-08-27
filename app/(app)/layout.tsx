"use client";

import React from "react";
import ProtectedRoute from "@/authmiddleware";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-navigation-bar";
import { Toaster } from "sonner";
import Chat from "@/components/chatbot";

type TDashboardLayoutProps = {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: TDashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="hidden lg:flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <Toaster richColors position="top-right" />
            {children}
            <Chat />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}