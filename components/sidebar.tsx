"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Avatar, AvatarFallback, AvatarImage } from "@/hooks/utils/common-imports";
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
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/apis/user-service";
import { getUserInitials } from "@/hooks/utils/common-utils";

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
    { id: 'wt-dashboard-nav-link', icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { id: 'wt-contacts-nav-link', icon: Users, label: "Contacts", path: "/contacts" },
    { id: 'wt-activities-nav-link', icon: Activity, label: "Activities", path: "/activities" },
    { id: 'wt-tags-nav-link', icon: Tags, label: "Tags", path: "/tags" },
    ...(userProfile?.role !== 'individual' ? [{ id: 'wt-chat-nav-link', icon: MessageCircle, label: "Chat", path: "/chat" }] : []),
  ];

  // Get user initials for avatar fallback
  const getUserInitialsForAvatar = () => {
    return getUserInitials(userProfile?.name || user?.displayName || undefined);
  };

  return (
    <div
      className={`sidebar-modern transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      } flex flex-col h-screen rounded-r-2xl m-2 mr-0`}
    >
      <div className="flex flex-col flex-1 min-h-0 p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent text-modern">
                CRM Pro
              </h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 h-8 w-8 rounded-full hover:bg-slate-100/80"
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
        <div className="mb-6 border-black-500 border-2 rounded-xl" id="wt-profile-nav-link">
          <Link
            href="/profile"
            className="flex items-center space-x-3 hover:bg-slate-100/80 p-3 rounded-xl transition-all duration-300 group"
          >
            <Avatar className="h-10 w-10 ring-2 ring-slate-200 group-hover:ring-purple-200 transition-all duration-300">
              <AvatarImage 
                src={userProfile?.photoUrl ? `${userProfile.photoUrl}?v=${new Date().getTime()}` : undefined}
                alt="Profile Avatar"
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-sm font-medium">
                {getUserInitialsForAvatar()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate text-modern">
                  {userProfile?.name || user?.displayName || "User"}
                </p>
                <p className="text-xs text-slate-500 truncate text-modern-light">
                  {userProfile?.email || user?.email || "user@example.com"}
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2" id="wt-sidebar-nav">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200/50 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-800 hover:shadow-sm"
                }`}
                id={item.id}
              >
                <item.icon
                  className={`h-5 w-5 transition-all duration-300 ${
                    isActive ? "text-purple-600" : "group-hover:text-slate-700"
                  }`}
                />
                {!collapsed && (
                  <span className={`font-medium text-modern ${
                    isActive ? "text-purple-700" : "text-slate-700"
                  }`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={logout}
          className={`w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-300 ${
            collapsed ? "px-0" : ""
          }`}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3 text-modern">Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;