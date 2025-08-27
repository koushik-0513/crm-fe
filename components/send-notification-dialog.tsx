import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { use_all_users, use_send_notification } from "@/hooks/apis/notification-service";
import { useUserProfile } from "@/hooks/apis/user-service";
import { MessageSquare } from "lucide-react";

export const SendNotificationDialog: React.FC = () => {
  const [is_open, setIsOpen] = useState(false);
  const [selected_user, setSelectedUser] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"admin_message" | "system_notification">("admin_message");

  const { data: user_profile } = useUserProfile();
  const { data: users_data } = use_all_users(1, 100);
  const send_notification_mutation = use_send_notification();

  const users = users_data?.data || [];

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selected_user || !title || !message) {
      return;
    }

    try {
      await send_notification_mutation.mutateAsync({
        recipient_uid: selected_user,
        title,
        message,
        type,
      });

      // Reset form
      setSelectedUser("");
      setTitle("");
      setMessage("");
      setType("admin_message");
      setIsOpen(false);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const handle_reset = () => {
    setSelectedUser("");
    setTitle("");
    setMessage("");
    setType("admin_message");
  };

  // Only show for admins
  if (user_profile?.role !== "admin") {
    return null;
  }

  return (
    <Dialog open={is_open} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-blue-100 hover:border-purple-300 transition-all duration-300">
          <MessageSquare className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200/50 bg-white/95 backdrop-blur-sm shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-800 text-modern">Send Notification to User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handle_submit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="user" className="text-slate-700 text-modern font-medium">Select User</Label>
            <Select value={selected_user} onValueChange={setSelectedUser}>
              <SelectTrigger className="rounded-xl border-slate-200/50 focus:border-purple-300 transition-all duration-300">
                <SelectValue placeholder="Choose a user to send message to" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200/50">
                {users.map((user) => (
                  <SelectItem key={user.uid} value={user.uid} className="text-modern-light">
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="type" className="text-slate-700 text-modern font-medium">Message Type</Label>
            <Select value={type} onValueChange={(value: "admin_message" | "system_notification") => setType(value)}>
              <SelectTrigger className="rounded-xl border-slate-200/50 focus:border-purple-300 transition-all duration-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200/50">
                <SelectItem value="admin_message" className="text-modern-light">Admin Message</SelectItem>
                <SelectItem value="system_notification" className="text-modern-light">System Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="title" className="text-slate-700 text-modern font-medium">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              required
              className="rounded-xl border-slate-200/50 focus:border-purple-300 transition-all duration-300 text-modern-light"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="message" className="text-slate-700 text-modern font-medium">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={4}
              required
              className="rounded-xl border-slate-200/50 focus:border-purple-300 transition-all duration-300 text-modern-light resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handle_reset}
              className="rounded-full border-slate-200/50 hover:border-slate-300 transition-all duration-300 text-modern-light"
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={send_notification_mutation.isPending || !selected_user || !title || !message}
              className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {send_notification_mutation.isPending ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
