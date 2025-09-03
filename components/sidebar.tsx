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
import { JoinTeamDialog } from "./join-team-dialog";

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
      className={`bg-sidebar border-sidebar-border border-r transition-all duration-300 ${collapsed ? "w-20" : "w-64"
        } flex flex-col h-screen mr-0`}
    >
      <div className="flex flex-col flex-1 min-h-0 p-4 dark:border-r-1 dark:border-[#6a7382]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <h2 className="text-xl font-bold text-sidebar-foreground text-modern">
                CRM Pro
              </h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 h-8 w-8 rounded-full hover:bg-sidebar-accent"
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
        <div className={`mb-6 border-sidebar-border border rounded-xl hover:bg-sidebar-accent/50 ${collapsed && 'border-0 hover:bg-white'}`} id="wt-profile-nav-link">
          <Link
            href="/profile"
            className="flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group"
          >
            <Avatar className="h-10 w-10 ring-sidebar-border transition-all duration-300">
              <AvatarImage
                src={userProfile?.photoUrl ? `${userProfile.photoUrl}?v=${new Date().getTime()}` : undefined}
                alt="Profile Avatar"
              />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
                {getUserInitialsForAvatar()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-accent-foreground truncate text-modern">
                  {userProfile?.name || user?.displayName || "User"}
                </p>
                <p className="text-xs text-sidebar-accent-foreground/70 truncate text-modern-light">
                  {userProfile?.email || user?.email || "user@example.com"}
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Join Team Section - Only show for users without a team */}
        {/* {!userProfile?.teamCode && (
          <div className="mb-4">
            <JoinTeamDialog />
          </div>
        )} */}

        {/* Navigation Menu */}
        <nav className="flex-1 flex flex-col space-y-2 justify-between h-full" id="wt-sidebar-nav">
          <div className="flex flex-col space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 transition-all duration-300 group rounded-sm ${isActive
                    ? "dark:bg-[#171717] text-sidebar-accent-foreground border border-sidebar-border"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:shadow-sm dark:hover:bg-[#2a2a2a]"
                    }`}
                  id={item.id}
                >
                  <item.icon
                    className={`h-5 w-5 transition-all duration-300 ${isActive ? "text-sidebar-accent-foreground" : "group-hover:text-sidebar-accent-foreground"
                      }`}
                  />
                  {!collapsed && (
                    <span className={`font-medium text-modern ${isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground"
                      }`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className={`w-full justify-start text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300 ${collapsed ? "px-0" : ""
              }`}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3 text-modern">Logout</span>}
          </Button>
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4">

      </div>
    </div>
  );
};

export default Sidebar;