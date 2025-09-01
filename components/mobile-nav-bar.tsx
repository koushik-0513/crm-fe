"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Button, 
  Avatar, 
  AvatarFallback, 
  AvatarImage,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../hooks/utils/common-imports";
import {
  LayoutDashboard,
  Users,
  Activity,
  Tags,
  MessageCircle,
  LogOut,
  Menu,
  Search,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/apis/user-service";
import { getUserInitials, useDebounce } from "@/hooks/utils/common-utils";
import { useSearch } from "@/hooks/apis/search-service";
import { TNavigationPage } from "@/hooks/utils/common-types";
import type { TSearchResults as SearchResults } from "@/types/global";
import { use_reset_all_walkthroughs } from "@/components/walk-through-component";
import { NotificationBell } from "@/components/notification-bell";
import { SendNotificationDialog } from "@/components/send-notification-dialog";
import { BulkNotificationDialog } from "@/components/bulk-notification-dialog";

// Extend Window interface for global functions
declare global {
  interface Window {
    refreshSidebarProfile?: () => void;
  }
}

const MobileNavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ pages: [], data: {} });
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const { reset_all_walkthroughs } = use_reset_all_walkthroughs();
  
  // Use TanStack Query hook for profile data
  const { data: userProfile, isLoading: loading } = useUserProfile();
  
  const debouncedQuery = useDebounce({ value: query, delay: 300 });
  const { data: searchData, isLoading: searchLoading } = useSearch(debouncedQuery);

  // Navigation items
  const menuItems = [
    { id: 'wt-dashboard-nav-link', icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { id: 'wt-contacts-nav-link', icon: Users, label: "Contacts", path: "/contacts" },
    { id: 'wt-activities-nav-link', icon: Activity, label: "Activities", path: "/activities" },
    { id: 'wt-tags-nav-link', icon: Tags, label: "Tags", path: "/tags" },
    ...(userProfile?.role !== 'individual' ? [{ id: 'wt-chat-nav-link', icon: MessageCircle, label: "Chat", path: "/chat" }] : []),
  ];

  const pages: TNavigationPage[] = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Contacts", path: "/contacts" },
    { name: "Activities", path: "/activities" },
    { name: "Tags", path: "/tags" },
    { name: "Profile", path: "/profile" },
  ];

  // Profile refresh logic
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profile-updated') {
        setRefreshTrigger(prev => prev + 1);
      }
    };

    window.refreshSidebarProfile = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      delete window.refreshSidebarProfile;
    };
  }, [refreshTrigger]);

  // Search logic
  useEffect(() => {
    if (searchData) {
      const filteredPages = pages.filter((page) =>
        page.name.toLowerCase().includes(query.toLowerCase())
      ).map(page => ({
        title: page.name,
        results: []
      }));
      setResults({ pages: filteredPages, data: searchData.data });
      setShowDropdown(true);
    } else if (debouncedQuery.trim() === "") {
      setResults({ pages: [], data: {} });
      setShowDropdown(false);
    }
  }, [searchData, query, debouncedQuery]);

  // Click outside handler for search
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target;
      if (searchRef.current && (!(target instanceof Node) || !searchRef.current.contains(target))) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getUserInitialsForAvatar = () => {
    return getUserInitials(userProfile?.name || user?.displayName || undefined);
  };

  const handleRestartWalkthrough = async () => {
    try {
      await reset_all_walkthroughs();
      console.log('All walkthroughs restarted successfully');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Failed to restart walkthroughs:', error);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Mobile Navigation Bar - Always present but styled for mobile */}
      <nav className="xl:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left section: Hamburger and Logo */}
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    CRM Pro
                  </SheetTitle>
                </SheetHeader>
                
                {/* Profile Section in Menu */}
                <div className="p-4 border-b">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 hover:bg-slate-100/80 p-3 rounded-xl transition-all duration-300"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-slate-200">
                      <AvatarImage 
                        src={userProfile?.photoUrl ? `${userProfile.photoUrl}?v=${new Date().getTime()}` : undefined}
                        alt="Profile Avatar"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-sm font-medium">
                        {getUserInitialsForAvatar()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {userProfile?.name || user?.displayName || "User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {userProfile?.email || user?.email || "user@example.com"}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4 space-y-2">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200/50"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-800"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${isActive ? "text-purple-600" : ""}`} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                  
                  {/* Restart Tour Button */}
                  <button
                    onClick={handleRestartWalkthrough}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100/80 hover:text-slate-800 transition-all duration-300"
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span className="font-medium">Restart Tour</span>
                  </button>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-300"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="ml-3">Logout</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CRM Pro
            </h2>
          </div>

          {/* Right section: Search, Notifications, Profile */}
          <div className="flex items-center gap-2">
            {/* Search Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <NotificationBell />
            
            {/* Send Notification (Admin only) */}
            <SendNotificationDialog />
            
            {/* Bulk Notification (Admin only) */}
            <BulkNotificationDialog />

            {/* Profile Avatar */}
            <Link href="/profile">
              <Avatar className="h-8 w-8 ring-2 ring-slate-200 cursor-pointer">
                <AvatarImage 
                  src={userProfile?.photoUrl ? `${userProfile.photoUrl}?v=${new Date().getTime()}` : undefined}
                  alt="Profile Avatar"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs font-medium">
                  {getUserInitialsForAvatar()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <div className="px-4 pb-3">
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              {searchLoading && debouncedQuery && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                </div>
              )}
              <Input
                placeholder="Search contacts, activities..."
                className={`pl-10 ${searchLoading && debouncedQuery ? 'pr-10' : ''} bg-slate-50/80 border-slate-200/50 focus:bg-white focus:border-purple-300 rounded-xl transition-all duration-300`}
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                onFocus={() => query && setShowDropdown(true)}
                autoFocus
              />
              
              {/* Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-12 left-0 right-0 bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {/* Pages */}
                  {filteredPages.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-sm font-semibold text-slate-700 border-b border-slate-100">
                        Pages
                      </div>
                      {filteredPages.map((page) => (
                        <div
                          key={page.path}
                          className="px-4 py-3 cursor-pointer hover:bg-slate-50/80 transition-colors duration-200"
                          onClick={() => {
                            router.push(page.path);
                            setSearchOpen(false);
                            setQuery("");
                          }}
                        >
                          {page.name}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Search Results */}
                  {Object.entries(results.data).map(([type, items]) =>
                    Array.isArray(items) && items.length > 0 ? (
                      <div key={type}>
                        <div className="px-4 py-2 text-sm font-semibold text-slate-700 border-b border-slate-100">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </div>
                        {items.map((item: any) => (
                          <div
                            key={item.id || item._id}
                            className="px-4 py-3 cursor-pointer hover:bg-slate-50/80 transition-colors duration-200"
                            onClick={() => {
                              if (type === "contacts")
                                router.push(`/contacts/${item.id || item._id}`);
                              else if (type === "tags") router.push(`/tags`);
                              else if (type === "activities")
                                router.push(`/activities`);
                              setSearchOpen(false);
                              setQuery("");
                            }}
                          >
                            {item.name || item.title || item.email}
                          </div>
                        ))}
                      </div>
                    ) : null
                  )}
                  
                  {/* Loading/No Results */}
                  {searchLoading && debouncedQuery && (
                    <div className="px-4 py-3 text-slate-500 text-center">
                      Searching...
                    </div>
                  )}
                  {!searchLoading && filteredPages.length === 0 &&
                    Object.values(results.data).every(
                      (arr) => Array.isArray(arr) && arr.length === 0
                    ) && query && (
                      <div className="px-4 py-3 text-slate-500">
                        No results found.
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="xl:hidden h-14" />
    </>
  );
};

export default MobileNavBar;