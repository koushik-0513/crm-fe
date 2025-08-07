"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Avatar, AvatarFallback, AvatarImage } from "@/hooks/utils/common-Imports";
import {
  LayoutDashboard,
  Users,
  Activity,
  Tags,
  MessageCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/Auth-Context";
import { useUserProfile } from "@/hooks/apis/profile-Service";
import { getUserInitials } from "@/hooks/utils/common-Utils";

// Extend Window interface for global functions
declare global {
  interface Window {
    refreshSidebarProfile?: () => void;
  }
}

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const pathname = usePathname();
  const { logout, user } = useAuth();

  // Use TanStack Query hook for profile data
  const { data: userProfile, isLoading: loading } = useUserProfile();

  // Combined useEffect for event listeners
  useEffect(() => {
    // Listen for storage events to refresh profile when updated from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profile-updated') {
        setRefreshTrigger(prev => prev + 1);
      }
    };

    // Expose refresh function globally for other components to trigger updates
    window.refreshSidebarProfile = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      delete window.refreshSidebarProfile;
    };
  }, [refreshTrigger]);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Contacts", path: "/contacts" },
    { icon: Activity, label: "Activities", path: "/activities" },
    { icon: Tags, label: "Tags", path: "/tags" },
  ];

  // Get user initials for avatar fallback
  const getUserInitialsForAvatar = () => {
    return getUserInitials(userProfile?.name || user?.displayName || undefined);
  };

  return (
    <div
      className={`bg-white border-r border-slate-200 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      } flex flex-col shadow-sm h-screen`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CRM Pro
              </h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 h-8 w-8"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-slate-200">
          <Link
            href="/profile"
            className="flex items-center space-x-3 hover:bg-slate-50 p-2 rounded-lg transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={userProfile?.photoUrl ? `${userProfile.photoUrl}?v=${new Date().getTime()}` : undefined}
                alt="Profile Avatar"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                {getUserInitialsForAvatar()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {userProfile?.name || user?.displayName || "User"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {userProfile?.email || user?.email || "user@example.com"}
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${isActive ? "text-blue-600" : ""}`}
                />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={logout}
          className={`w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 ${
            collapsed ? "px-0" : ""
          }`}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;