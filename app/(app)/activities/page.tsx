"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/hooks/utils/common-imports";
import { UserPlus, Tags, Loader2, Filter, Calendar, Activity as ActivityIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { usePaginatedActivities } from "@/hooks/apis/activity-service";
import { TDateRangeSelection } from "@/hooks/utils/common-types";
import { formatActivityType, formatActivityTime } from "@/hooks/utils/common-utils";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import type { TActivity } from "@/types/global";
import { Walkthrough } from "@/components/walk-through-component";
import { getPageWalkthroughSteps, WalkthroughPage } from "@/types/walkthrough-config";
import { useTheme } from "next-themes";

// Updated icon mapping with new Lucide icons
const iconMap: Record<string, { icon: React.ComponentType<{ className?: string }> }> = {
  "CONTACT CREATED": { icon: UserPlus },
  "CONTACT EDITED": { icon: UserPlus },
  "CONTACT DELETED": { icon: UserPlus },
  "TAG CREATED": { icon: Tags },
  "TAG EDITED": { icon: Tags },
  "TAG DELETED": { icon: Tags },
  "FORCE DELETE TAG": { icon: Tags },
  "BULK IMPORT CONTACTS": { icon: UserPlus },
  "BULK DELETE CONTACTS": { icon: UserPlus },
  "ACCOUNT DELETED": { icon: UserPlus },
};

function getActivityIconAndColor(type: string) {
  const iconData = iconMap[type];
  if (iconData) {
    return iconData;
  }
  // Default fallback
  return {
    icon: UserPlus,
  };
}

function formatActivityTypeDisplay(type: string) {
  return formatActivityType(type);
}

function formatActivityTimeDisplay(timestamp: string | Date) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date ? formatActivityTime(date) : "";
}

const Activities = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activities, setActivities] = useState<TActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedActivityType, setSelectedActivityType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<TDateRangeSelection[]>([
    { startDate: undefined, endDate: undefined, key: "selection" },
  ]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const LIMIT = 10;


  // Combined useEffect for pagination and data management
  useEffect(() => {
    setPage(1);
  }, [user, dateRange, selectedActivityType]);

  // Use TanStack Query for paginated activities
  const { data: result, isLoading, error } = usePaginatedActivities(
    page,
    LIMIT,
    selectedActivityType !== "all" ? selectedActivityType : undefined,
    dateRange[0].startDate?.toISOString(),
    dateRange[0].endDate?.toISOString()
  );

  console.log('Activities page - result:', result, 'isLoading:', isLoading, 'error:', error);

  // Combined useEffect for result processing and loading state
  useEffect(() => {
    console.log('Processing activities result:', result);
    if (result && Array.isArray(result)) {
      if (page === 1) {
        setActivities(result);
        const types = Array.from(new Set(result.map((a) => a.activityType)));
        setActivityTypes(types);
      } else {
        setActivities((prev) => {
          const newActivities = [...prev, ...result];
          const types = Array.from(new Set(newActivities.map((a: TActivity) => a.activityType)));
          setActivityTypes(types);
          return newActivities;
        });
      }
      setHasMore(result.length === LIMIT);
    }

    setLoading(isLoading);
  }, [result, page, isLoading]);

  // Combined useEffect for date picker and click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const filteredActivities = activities.filter((activity) => {
    if (dateRange[0].startDate && dateRange[0].endDate) {
      const activityDate = typeof activity.timestamp === 'string'
        ? new Date(activity.timestamp)
        : activity.timestamp;
      const start = new Date(dateRange[0].startDate);
      const end = new Date(dateRange[0].endDate);
      end.setHours(23, 59, 59, 999);
      if (activityDate < start || activityDate > end) return false;
    }
    if (
      selectedActivityType !== "all" &&
      activity.activityType !== selectedActivityType
    )
      return false;
    return true;
  });

  function ActivityItem({ activity }: { activity: TActivity }) {
    const { icon: ActivityIcon } = getActivityIconAndColor(activity.activityType);
    const isUserActivity = activity.activityType.toLowerCase().includes('user login');

    // Parse activity details for better display
    const getActivityTitle = () => {
      if (activity.details) {
        // Extract the main part before the first period or comma
        const mainPart = activity.details.split(/[,.]/)[0];
        return mainPart.trim();
      }
      return formatActivityTypeDisplay(activity.activityType);
    };

    const getActivityDescription = () => {
      if (activity.details) {
        // Get the rest of the details after the first part
        const parts = activity.details.split(/[,.]/);
        if (parts.length > 1) {
          return parts.slice(1).join(', ').trim();
        }
      }
      return null;
    };

    const getCategoryBadge = () => {
      if (isUserActivity) return 'User';
      if (activity.activityType.includes('CONTACT')) return 'Contact';
      if (activity.activityType.includes('TAG')) return 'Tag';
      return 'System';
    };

    return (
      <div className="bg-card border border-border rounded-lg p-5 hover:bg-accent/30 transition-all duration-200  dark:border-[#343434]">
        <div className="flex items-start gap-4">
          {/* Activity Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-border flex items-center justify-center">
              <ActivityIcon className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-foreground text-base leading-6">
                    {getActivityTitle()}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-secondary/50 text-secondary-foreground border-border text-xs font-medium px-2 py-1 shrink-0"
                  >
                    {getCategoryBadge()}
                  </Badge>
                </div>

                {getActivityDescription() && (
                  <p className="text-muted-foreground text-sm leading-5">
                    {getActivityDescription()}
                  </p>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex-shrink-0">
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatActivityTimeDisplay(activity.timestamp)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load activities</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 activities-timeline">
      {/* Header and Filters */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ActivityIcon className="h-6 w-6 text-foreground" id="wt-activities-page-title" />
            <h1 className="text-2xl font-semibold text-foreground">Activity Timeline</h1>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowDatePicker((v) => !v)}
              className="bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground dark:border-[#343434]"
              id="wt-activities-date-range"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {dateRange[0].startDate && dateRange[0].endDate ? (
                `${dateRange[0].startDate.toLocaleDateString()} - ${dateRange[0].endDate.toLocaleDateString()}`
              ) : (
                "Select Date Range"
              )}
            </Button>
            {showDatePicker && (
              <div className="absolute z-50 mt-2 bg-popover border border-border rounded-lg shadow-lg p-4 date-picker-container dark:border-[#343434]">
                <div className="mb-2 font-semibold text-sm text-popover-foreground">
                  Select Date Range
                </div>
                <DateRange
                  ranges={dateRange}
                  onChange={(item) => setDateRange([item.selection])}
                  months={1}
                  direction="horizontal"
                  rangeColors={[theme === 'dark' ? '#ffffff' : '#000000']}
                  moveRangeOnFirstSelection={false}
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDateRange([
                        { startDate: undefined, endDate: undefined, key: "selection" },
                      ]);
                      setShowDatePicker(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setShowDatePicker(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Activity Type Filter */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowFilters((v) => !v)}
              className="bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground dark:border-[#343434] "
              id="wt-activities-filter"
            >
              <Filter className="h-4 w-4 mr-2" />
              {selectedActivityType === "all" ? "All Actions" : formatActivityTypeDisplay(selectedActivityType)}
            </Button>
            {showFilters && (
              <div className="absolute z-50 mt-2 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px] dark:border-gray-700">
                <div className="mb-2 font-medium text-sm text-popover-foreground">
                  Activity Type
                </div>
                <select
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedActivityType}
                  onChange={(e) => {
                    setSelectedActivityType(e.target.value);
                    setShowFilters(false);
                  }}
                >
                  <option value="all">All Actions</option>
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatActivityTypeDisplay(type)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={() => {
              setDateRange([
                { startDate: undefined, endDate: undefined, key: "selection" },
              ]);
              setSelectedActivityType("all");
            }}
            className="bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground dark:border-[#343434]"
            id="wt-activities-clear-filters"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Filter Summary */}
      {(selectedActivityType !== "all" || (dateRange[0].startDate && dateRange[0].endDate)) && (
        <div className="mb-6 p-4 bg-accent/50 border border-border rounded-lg">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-accent-foreground">Action: {selectedActivityType === "all" ? "All" : formatActivityTypeDisplay(selectedActivityType)}</span>
            {dateRange[0].startDate && dateRange[0].endDate && (
              <span className="text-muted-foreground">
                • {dateRange[0].startDate.toLocaleDateString()} - {dateRange[0].endDate.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-4" id="wt-activities-list-container">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No activities found</p>
            <p className="text-muted-foreground text-sm">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <ActivityItem key={activity._id} activity={activity} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pt-6">
            <Button
              variant="outline"
              onClick={() => {
                console.log('Load more clicked, current page:', page, 'hasMore:', hasMore);
                setPage((prev) => {
                  const newPage = prev + 1;
                  console.log('Setting page to:', newPage);
                  return newPage;
                });
              }}
              disabled={loading}
              className="bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground dark:border-gray-700 px-6 py-2"
              id="wt-activities-load-more"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading more...
                </>
              ) : (
                "Load More Activities"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Page-specific walkthrough */}
      <Walkthrough steps={getPageWalkthroughSteps(WalkthroughPage.ACTIVITIES)} auto_start={true} page_name={WalkthroughPage.ACTIVITIES} />
    </div>
  );
};

export default Activities;
