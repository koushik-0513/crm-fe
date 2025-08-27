"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/hooks/utils/common-imports";
import { UserPlus, Tags, Loader2, Filter, Calendar, Activity as ActivityIcon} from "lucide-react";
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
    return (
      <div className="relative flex items-start gap-4">
        <div className="z-10">
          <span
            className={`flex items-center justify-center h-10 w-10 rounded-full bg-gray-40  0 shadow-lg ring-4 ring-white`}
          >
            <ActivityIcon className="h-5 w-5 text-white" />
          </span>
        </div>
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow border border-slate-100 px-6 py-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-base text-slate-900">
                {formatActivityTypeDisplay(activity.activityType)}
              </span>
            </div>
            <div className="text-slate-700 mb-2 text-sm">
              {activity.details || activity.activityType}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>{formatActivityTimeDisplay(activity.timestamp)}</span>
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load activities</p>
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
    <div className="space-y-6 m-7">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5 activities-header" id="wt-activities-page-title" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowFilters((v) => !v)}
                className="activities-filter"
                id="wt-activities-filter"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              {showFilters && (
                <div className="absolute z-50 mt-2 bg-white border rounded shadow p-2 min-w-[180px]">
                  <div className="mb-2 font-semibold text-sm">
                    Activity Type
                  </div>
                  <select
                    className="w-full border rounded px-2 py-1 text-sm "
                    value={selectedActivityType}
                    onChange={(e) => {
                      setSelectedActivityType(e.target.value);
                      setShowFilters(false);
                    }}
                  >
                    <option value="all">All Types</option>
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatActivityTypeDisplay(type)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowDatePicker((v) => !v)}
                className={`${dateRange[0].startDate && dateRange[0].endDate ? "border-blue-500 bg-blue-50" : ""} activities-date-range`}
                id="wt-activities-date-range"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {dateRange[0].startDate && dateRange[0].endDate ? (
                  `${dateRange[0].startDate.toLocaleDateString()} - ${dateRange[0].endDate.toLocaleDateString()}`
                ) : (
                  "Date Range"
                )}
              </Button>
              {showDatePicker && (
                <div className="absolute z-50 mt-2 bg-white border rounded shadow p-4 date-picker-container">
                  <div className="mb-2 font-semibold text-sm">
                    Select Date Range
                  </div>
                  <DateRange
                    ranges={dateRange}
                    onChange={(item) => setDateRange([item.selection])}
                    months={1}
                    direction="horizontal"
                    rangeColors={["#3b82f6"]}
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
                      onClick={() => setShowDatePicker(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Clear All Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setDateRange([
                  { startDate: undefined, endDate: undefined, key: "selection" },
                ]);
                setSelectedActivityType("all");
              }}
              className="activities-clear-filters"
              id="wt-activities-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Summary */}
      {(selectedActivityType !== "all" || (dateRange[0].startDate && dateRange[0].endDate)) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-blue-700">Active Filters:</span>
              {selectedActivityType !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Type: {formatActivityTypeDisplay(selectedActivityType)}
                </Badge>
              )}
              {dateRange[0].startDate && dateRange[0].endDate && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Date: {dateRange[0].startDate.toLocaleDateString()} - {dateRange[0].endDate.toLocaleDateString()}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="space-y-6 activities-timeline" id="wt-activities-list-container">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-slate-500">No activities found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredActivities.map((activity) => (
              <ActivityItem key={activity._id} activity={activity} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center">
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
              className="load-more-button"
              id="wt-activities-load-more"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Page-specific walkthrough */}
      <Walkthrough steps={getPageWalkthroughSteps(WalkthroughPage.ACTIVITIES)} auto_start={true} className="activities-walkthrough" page_name={WalkthroughPage.ACTIVITIES}  />
    </div>
  );
};

export default Activities;
