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
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-slate-600" />
          Activity History
          <span className="text-sm font-normal text-slate-500 ml-2">
            ({activities.length} activities)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const ActivityIcon = getActivityIcon(activity.activityType);
            const isLast = index === activities.length - 1;
            
            return (
              <div
                key={activity._id}
                className={`relative flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-slate-50/80 ${
                  isLast ? 'border-0' : 'border-b border-slate-100'
                }`}
              >
                {/* Activity Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center border border-blue-100">
                  <ActivityIcon className="h-5 w-5 text-blue-600" />
                </div>
                
                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {activity.activityType.replace(/_/g, ' ')}
                      </h4>
                      {activity.details && (
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                          {activity.details}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {activity.user && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                          {activity.user}
                        </span>
                      )}
                      <time className="text-xs text-slate-400 font-medium">
                        {formatTimestamp(activity.timestamp)}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary */}
        {activities.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Showing {activities.length} activities</span>
              <span>Most recent first</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityHistory;
