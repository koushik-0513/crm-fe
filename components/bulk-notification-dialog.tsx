"use client";

import { useState } from "react";
import { Button } from "@/hooks/utils/common-imports";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/hooks/utils/common-imports";
import { Textarea, Input } from "@/hooks/utils/common-imports";
import { useUserProfile } from "@/hooks/apis/user-service";
import { toast } from "sonner";
import { Users, Send } from "lucide-react";

export function BulkNotificationDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: userProfile } = useUserProfile();

  const handleSendBulkNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in both title and message");
      return;
    }

    if (!userProfile?.teamCode) {
      toast.error("No team code found");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notification/send-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          teamCode: userProfile.teamCode,
          title: title.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Notification sent to ${data.data.sentCount} team members`);
        setOpen(false);
        setTitle("");
        setMessage("");
      } else {
        toast.error(data.message || "Failed to send bulk notification");
      }
    } catch (error) {
      console.error("Error sending bulk notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for admin users with a team
  if (userProfile?.role !== "admin" || !userProfile?.teamCode) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Notify Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Send Team Notification
          </DialogTitle>
          <DialogDescription>
            Send a notification to all team members in your organization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="notification-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="notification-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="mt-1"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
          </div>
          
          <div>
            <label htmlFor="notification-message" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              className="mt-1 min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500</p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Team:</strong> {userProfile?.organizationName || "Your Organization"}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This will be sent to all team members with role "user"
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setTitle("");
              setMessage("");
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendBulkNotification}
            disabled={isLoading || !title.trim() || !message.trim()}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isLoading ? "Sending..." : "Send to Team"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
