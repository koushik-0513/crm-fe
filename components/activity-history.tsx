import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, UserPlus, UserMinus, UserRoundCog, FileUser, Tag as TagIcon, Tags, Trash2, Repeat2 } from "lucide-react";
import type { TActivity } from "@/types/global";
import { formatTimestamp } from "@/hooks/utils/common-utils";

interface ActivityHistoryProps {
  activities: TActivity[];
  isLoading: boolean;
  error: unknown;
  onRetry?: () => void;
}

// Helper function to get activity icon
const getActivityIcon = (activityType: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "CONTACT CREATED": UserPlus,
    "CONTACT EDITED": UserRoundCog,
    "CONTACT DELETED": UserMinus,
    "TAG CREATED": TagIcon,
    "TAG EDITED": Tags,
    "TAG DELETED": Trash2,
    "FORCE DELETE TAG": Trash2,
    "BULK IMPORT CONTACTS": Repeat2,
    "BULK DELETE CONTACTS": UserMinus,
    "ACCOUNT DELETED": UserMinus,
  };
  return iconMap[activityType] || FileUser;
};

const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  activities,
  isLoading,
  error,
  onRetry
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-slate-600">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Failed to load activities</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No activity yet</p>
            <p className="text-slate-400 text-sm">
              Activity will appear here when actions are performed on this contact.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.activityType);
            return (
              <div
                key={activity._id}
                className="flex items-start space-x-3 p-4 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <ActivityIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">
                      {activity.activityType}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {activity.details || "No details available"}
                  </p>
                  {activity.user && (
                    <p className="text-xs text-slate-400 mt-1">
                      User: {activity.user}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityHistory;
