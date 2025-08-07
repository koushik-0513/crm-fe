"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input, Search } from "@/hooks/utils/common-Imports";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/apis/search-Service";
import { TNavigationPage } from "@/hooks/utils/common-Types";
import { useDebounce } from "@/hooks/utils/common-Utils";
import type { TSearchResults as SearchResults, TSearchResultItem as SearchResultItem } from "@/types/global";

const TopBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ pages: [], data: {} });
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const router = useRouter();
  const inputRef = useRef<HTMLDivElement>(null);

  // Debounce the search query to avoid too many API calls
  const debouncedQuery = useDebounce({ value: query, delay: 300 });

  // Use TanStack Query hook for search with debounced query
  const { data: searchData, isLoading: searchLoading } = useSearch(debouncedQuery);

  // Update results when search data changes
  useEffect(() => {
    if (searchData) {
      // Search pages
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

  // Hide dropdown on click outside
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

  // Filter navigation pages based on query
  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative" ref={inputRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            {searchLoading && debouncedQuery && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
            <Input
              placeholder="Search contacts, activities..."
              className={`pl-10 ${searchLoading && debouncedQuery ? 'pr-10' : ''} bg-slate-50 border-slate-200 focus:bg-white`}
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onFocus={() => query && setShowDropdown(true)}
            />
            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 4,
                  zIndex: 100,
                  maxHeight: 300,
                  overflowY: "auto",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {/* Pages */}
                {filteredPages.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        padding: "4px 8px",
                      }}
                    >
                      Pages
                    </div>
                    {filteredPages.map((page) => (
                      <div
                        key={page.path}
                        style={{
                          padding: "6px 12px",
                          cursor: "pointer",
                        }}
                        onClick={() => router.push(page.path)}
                      >
                        {page.name}
                      </div>
                    ))}
                    <hr />
                  </div>
                )}
                {/* Data */}
                {Object.entries(results.data).map(([type, items]) =>
                  Array.isArray(items) && items.length > 0 ? (
                    <div key={type}>
                      <div
                        style={{
                          fontWeight: "bold",
                          padding: "4px 8px",
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                      {(items as SearchResultItem[]).map((item: SearchResultItem) => (
                        <div
                          key={item.id || item._id}
                          style={{
                            padding: "6px 12px",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            // Example: navigate to contact/tag/activity detail page
                            if (type === "contacts")
                              router.push(`/contacts/${item.id || item._id}`);
                            else if (type === "tags") router.push(`/tags`);
                            else if (type === "activities")
                              router.push(`/activities`);
                          }}
                        >
                          {item.name || item.title || item.email}
                        </div>
                      ))}
                      <hr />
                    </div>
                  ) : null
                )}
                {/* Loading state */}
                {searchLoading && debouncedQuery && (
                  <div style={{ padding: "8px", color: "#888", textAlign: "center" }}>
                    Searching...
                  </div>
                )}
                {/* No results */}
                {!searchLoading && filteredPages.length === 0 &&
                  Object.values(results.data).every(
                    (arr) => Array.isArray(arr) && arr.length === 0
                  ) && (
                    <div style={{ padding: "8px", color: "#888" }}>
                      No results found.
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
