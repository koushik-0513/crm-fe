"use client";

import React from "react";
import { AuthProvider } from "@/contexts/Auth-Context";
import ProtectedRoute from "@/authmiddleware";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Toaster } from "sonner";
import Chat from "@/components/chatbot";
import { Walkthrough, CRM_WALKTHROUGH_STEPS } from "@/components/Walkthrough";

type TDashboardLayoutProps = {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: TDashboardLayoutProps) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col h-full">
            <TopBar />
            <main className="flex-1 overflow-auto p-6">
              <Toaster richColors position="top-right" />
              {children}
              <Chat />
            </main>
          </div>
          <Walkthrough steps={CRM_WALKTHROUGH_STEPS} />
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
