import { auth } from "@/firebase";
import { getIdToken } from "firebase/auth";
import { QueryClient } from "@tanstack/react-query";

// Common API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Common headers for authenticated requests
export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User not authenticated");
  }
  
  // Force token refresh to ensure it's valid
  const token = await getIdToken(currentUser, true);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Common fetch wrapper for authenticated requests
export const authenticatedFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response;
};

// Common mutation success handler
export const createMutationSuccessHandler = (
  queryClient: QueryClient,
  successMessage: string,
  queriesToInvalidate: string[] = []
) => {
  return (data: { message?: string } | { success: boolean; results: unknown[] } | unknown) => {
    // Show success toast if data has a message property
    if (data && typeof data === 'object' && 'message' in data && data.message) {
      // Import toast dynamically to avoid circular dependencies
      import("sonner").then(({ toast }) => {
        const message = typeof data.message === 'string' ? data.message : successMessage;
        toast.success(message);
      });
    } else {
      import("sonner").then(({ toast }) => {
        toast.success(successMessage);
      });
    }
    
    // Invalidate specified queries
    queriesToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  };
};

// Common mutation error handler
export const createMutationErrorHandler = (defaultMessage: string = "Operation failed") => {
  return (error: Error) => {
    import("sonner").then(({ toast }) => {
      toast.error(error.message || defaultMessage);
    });
  };
};

// Common query configuration
export const createQueryConfig = (staleTime: number = 30 * 1000) => ({
  staleTime,
  refetchOnWindowFocus: true,
});

// Common activity-related query keys
export const ACTIVITY_QUERY_KEYS = {
  activities: ["activities"] as string[],
  paginatedActivities: ["paginated-activities"] as string[],
  contactActivities: (contactId: string) => ["contact-activities", contactId] as string[],
} as const;

// Common contact-related query keys
export const CONTACT_QUERY_KEYS = {
  contacts: ["contacts"] as string[],
  contactStats: ["contact-stats"] as string[],
  contact: (contactId: string) => ["contact", contactId] as string[],
} as const;

// Common tag-related query keys
export const TAG_QUERY_KEYS = {
  tags: ["tags"] as string[],
} as const;

// Common chat-related query keys
export const CHAT_QUERY_KEYS = {
  chatHistory: ["chat-history"] as string[],
  conversation: (conversationId: string) => ["conversation", conversationId] as string[],
} as const;

// Common profile-related query keys
export const PROFILE_QUERY_KEYS = {
  userProfile: ["user-profile"] as string[],
} as const;

// Helper to invalidate multiple queries
export const invalidateQueries = (queryClient: QueryClient, queryKeys: (string | string[])[]) => {
  queryKeys.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
  });
};