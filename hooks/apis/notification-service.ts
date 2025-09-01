import { auth } from "@/firebase";
import { getIdToken } from "firebase/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TNotification, TNotificationForm } from "@/types/global";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
// API Functions
export const get_user_notifications = async (page = 1, limit = 10, status?: string): Promise<{
  data: TNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);
  
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (status) {
    params.append("status", status);
  }

  const response = await fetch(
    `${apiUrl}/api/notifications?${params}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

export const send_notification = async (notificationData: TNotificationForm): Promise<TNotification> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const response = await fetch(
    `${apiUrl}/api/notifications/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(notificationData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to send notification: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

export const mark_notification_read = async (notificationId: string): Promise<TNotification> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  const response = await fetch(
    `${apiUrl}/api/notifications/${notificationId}/read`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

export const get_all_users = async (page = 1, limit = 50): Promise<{
  data: Array<{
    uid: string;
    name: string;
    email: string;
    company: string;
    organizationName?: string;
    teamCode?: string;
    role: string;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(
    `${apiUrl}/api/notifications/users?${params}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

// TanStack Query Hooks
export const use_user_notifications = (page = 1, limit = 10, status?: string) => {
  return useQuery({
    queryKey: ["user-notifications", page, limit, status],
    queryFn: () => get_user_notifications(page, limit, status),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const use_send_notification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: send_notification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      toast.success("Notification sent successfully");
    },
    onError: () => {
      const errorMessage = "Failed to send notification";
      toast.error(errorMessage);
    },
  });
};

export const use_mark_notification_read = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: mark_notification_read,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    },
    onError: () => {
      toast.error("Failed to mark notification as read");
    },
  });
};

export const use_all_users = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: ["all-users", page, limit],
    queryFn: () => get_all_users(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
