import { useQuery } from "@tanstack/react-query";
import { authenticatedFetch, createQueryConfig, ACTIVITY_QUERY_KEYS } from "@/hooks/utils/api-Utils";
import type { TActivity } from "@/types/global";
import { validateApiResponse, activityResponseSchema, activitiesResponseSchema, contactActivitiesResponseSchema } from "@/types/validation-Schemas";

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
  return validateApiResponse(activityResponseSchema, data);
  } catch (err) {
    console.error("Error fetching activities:", err);
    return [];
  }
};

export const getActivitiesForContact = async (contactId: string): Promise<TActivity[]> => {
  if (!contactId) throw new Error("Contact ID is required");
  
  try {
    const response = await authenticatedFetch(`/api/activities/${contactId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch contact activities");
    }
    
    // Extract activities from the response structure
    if (data.success && data.activities) {
      const validatedData = validateApiResponse(contactActivitiesResponseSchema, data);
      return validatedData.activities;
    }
    
    // Fallback to direct array if the structure is different
    return validateApiResponse(activityResponseSchema, data.activities || []);
  } catch (error) {
    console.error("Error fetching contact activities:", error);
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
  
      // Extract activities from the response structure
    if (data.data && data.data.activities) {
      return validateApiResponse(activityResponseSchema, data.data.activities);
    }
    
    // Fallback to direct array if the structure is different
    return validateApiResponse(activityResponseSchema, data);
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
    ...createQueryConfig({}),
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
