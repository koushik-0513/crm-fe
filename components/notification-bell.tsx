import React, { useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { use_user_notifications, use_mark_notification_read } from "@/hooks/apis/notification-service";
import { useUserProfile } from "@/hooks/apis/user-service";
import { formatDistanceToNow } from "date-fns";
import { TNotification } from "@/types/global";

export const NotificationBell: React.FC = () => {
  const [is_open, setIsOpen] = useState(false);
  const { data: user_profile } = useUserProfile();
  const { data: notifications_data } = use_user_notifications(1, 10);
  const mark_read_mutation = use_mark_notification_read();

  const notifications = notifications_data?.data || [];
  const unread_count = notifications.filter(n => n.status === "unread").length;

  const handle_mark_read = async (notification_id: string) => {
    try {
      await mark_read_mutation.mutateAsync(notification_id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handle_notification_click = (notification: TNotification) => {
    if (notification.status === "unread") {
      handle_mark_read(notification._id);
    }
  };

  // Only show for users, not admins
  if (user_profile?.role === "admin") {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!is_open)}
        className="relative rounded-full hover:bg-slate-100/80 transition-all duration-300"
      >
        <Bell className="h-5 w-5" />
        {unread_count > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500"
          >
            {unread_count > 9 ? "9+" : unread_count}
          </Badge>
        )}
      </Button>

      {is_open && (
        <div className="absolute right-0 top-12 w-80 z-50">
          <Card className="shadow-2xl border-slate-200/50 bg-white/95 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-800 text-modern">Notifications</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 rounded-full hover:bg-slate-100/80"
              >
                <X className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 text-modern-light">
                  No notifications
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md ${
                        notification.status === "unread"
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50 hover:from-blue-100 hover:to-purple-100"
                          : "bg-slate-50/50 border-slate-200/50 hover:bg-slate-100/50"
                      }`}
                      onClick={() => handle_notification_click(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-slate-800 text-modern">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-slate-600 mt-2 text-modern-light">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-slate-500 text-modern-light">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                            {notification.status === "unread" && (
                              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backdrop */}
      {is_open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
