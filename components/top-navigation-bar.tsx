"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input, Search, Button } from "@/hooks/utils/common-imports";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/apis/search-service";
import { TNavigationPage } from "@/hooks/utils/common-types";
import { useDebounce } from "@/hooks/utils/common-utils";
import { RotateCcw } from "lucide-react";
import type { TSearchResults as SearchResults, TSearchResultItem as SearchResultItem } from "@/types/global";
import { use_reset_all_walkthroughs } from "@/components/walk-through-component";

const TopBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ pages: [], data: {} });
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const router = useRouter();
  const inputRef = useRef<HTMLDivElement>(null);
  const { reset_all_walkthroughs } = use_reset_all_walkthroughs();

  const debouncedQuery = useDebounce({ value: query, delay: 300 });

  const { data: searchData, isLoading: searchLoading } = useSearch(debouncedQuery);

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
              const target = e.target;
        if (inputRef.current && (!(target instanceof Node) || !inputRef.current.contains(target))) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const pages: TNavigationPage[] = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Contacts", path: "/contacts" },
    { name: "Activities", path: "/activities" },
    { name: "Tags", path: "/tags" },
    { name: "Profile", path: "/profile" },
  ];

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleRestartWalkthrough = async () => {
    try {
      await reset_all_walkthroughs();
      console.log('All walkthroughs restarted successfully');
    } catch (error) {
      console.error('Failed to restart walkthroughs:', error);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-4 lg:px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative" ref={inputRef} id="wt-global-search">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            {searchLoading && debouncedQuery && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
              </div>
            )}
            <Input
              placeholder="Search contacts, activities..."
              className={`pl-10 ${searchLoading && debouncedQuery ? 'pr-10' : ''} bg-slate-50/80 border-slate-200/50 focus:bg-white focus:border-purple-300 rounded-xl transition-all duration-300 text-sm lg:text-base`}
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onFocus={() => query && setShowDropdown(true)}
            />
            {showDropdown && (
              <div className="absolute top-12 left-0 right-0 bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
                {/* Pages */}
                {filteredPages.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-sm font-semibold text-slate-700 text-modern border-b border-slate-100">
                      Pages
                    </div>
                    {filteredPages.map((page) => (
                      <div
                        key={page.path}
                        className="px-4 py-3 cursor-pointer hover:bg-slate-50/80 transition-colors duration-200"
                        onClick={() => {
                          router.push(page.path);
                          setQuery("");
                          setShowDropdown(false);
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
                      <div className="px-4 py-2 text-sm font-semibold text-slate-700 text-modern border-b border-slate-100">
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
                            setQuery("");
                            setShowDropdown(false);
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
        
        {/* Right side actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestartWalkthrough}
            className="hidden xl:flex items-center space-x-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50/80 rounded-xl transition-all duration-300"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-sm">Restart Tour</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
