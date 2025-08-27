import { useQuery } from "@tanstack/react-query";
import { authenticatedFetch, createQueryConfig, ACTIVITY_QUERY_KEYS } from "@/hooks/utils/api-utils";
import type { TActivity } from "@/types/global";

// ============================================================================
// ACTIVITY SERVICE SPECIFIC TYPES
// ============================================================================

export type TActivityServiceResponse = {
  activities: TActivity[];
  message: string;
}

export type TActivitiesResponse = {
  activities: TActivity[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    total_items: number;
  };
}

// API Functions
export const getActivityLogs = async (): Promise<TActivity[]> => {
  try {
      const response = await authenticatedFetch("/api/activities");
  const data = await response.json();
  return data;
  } catch (err) {
    console.error("Error fetching activities:", err);
    return [];
  }
};

export const getActivitiesForContact = async (contactId: string): Promise<TActivity[]> => {
  if (!contactId) throw new Error("Contact ID is required");
  
  try {
    console.log("Frontend: Fetching activities for contact:", contactId);
    const response = await authenticatedFetch(`/api/activities/${contactId}`);
    const data = await response.json();
    
    console.log("Frontend: Received response:", data);
    return data.activities || [];
  } catch (error) {
    console.error("Frontend: Error fetching contact activities:", error);
    throw error;
  }
};

export const getPaginatedActivities = async (
  page?: number,
  limit?: number,
  type?: string,
  startDate?: string,
  endDate?: string
): Promise<TActivity[]> => {
  const params = new URLSearchParams();

  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (type) params.append('type', type);
  if (startDate) params.append('start', startDate);
  if (endDate) params.append('end', endDate);

  const response = await authenticatedFetch(`/api/activities?${params.toString()}`);
  const data = await response.json();
  
  // The backend returns activities directly, not wrapped in a data object
  return data || [];
};

// TanStack Query Hooks
export const useActivityLogs = () => {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.activities,
    queryFn: () => getActivityLogs(),
    ...createQueryConfig({}),
  });
};

export const useContactActivities = (contactId: string) => {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.contactActivities(contactId),
    queryFn: () => getActivitiesForContact(contactId),
    enabled: !!contactId,
    ...createQueryConfig({ staleTime: 5 * 60 * 1000 }), // 5 minutes stale time to prevent unnecessary refetches
  });
};

export const usePaginatedActivities = (
  page: number, 
  limit: number, 
  type?: string, 
  startDate?: string, 
  endDate?: string
) => {
  return useQuery({
    queryKey: [...ACTIVITY_QUERY_KEYS.paginatedActivities, page, limit, type, startDate, endDate],
    queryFn: () => getPaginatedActivities(page, limit, type, startDate, endDate),
    ...createQueryConfig({}),
  });
};
