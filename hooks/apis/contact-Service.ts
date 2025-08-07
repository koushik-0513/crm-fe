import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/firebase";
import { 
  authenticatedFetch, 
  createQueryConfig, 
  CONTACT_QUERY_KEYS,
  ACTIVITY_QUERY_KEYS,
  createMutationSuccessHandler,
  createMutationErrorHandler,
  invalidateQueries
} from "@/hooks/utils/api-Utils";
import type { 
  TContact, 
  TContactForm,
  TPagination
} from "@/types/global";
import { validateApiResponse, contactServiceResponseSchema, contactCreateResponseSchema, contactUpdateResponseSchema, contactDeleteResponseSchema, contactBulkDeleteResponseSchema, contactImportResponseSchema, dashboardStatsSchema } from "@/types/validation-Schemas";

// ============================================================================
// CONTACT SERVICE SPECIFIC TYPES
// ============================================================================

export type TContactServiceResponse = {
  message?: string;
  contacts: TContact[];
  pagination?: TPagination;
}

export type TContactQueryParams = {
  search?: string;
  page?: number;
  limit?: number;
  tags?: string;
}

export type TGetAllContactsParams = {
  search?: string;
  page?: number;
  limit?: number;
  tag?: string;
}

export type TUpdateContactParams = {
  contactId: string;
  contactData: Partial<TContactForm>;
}

export type TDeleteMultipleContactsParams = {
  contactIds: string[];
}

export type TImportContactsParams = {
  contacts: TContactForm[];
}

export type TContactCreateResponse = {
  message: string;
  contact: TContact;
}

export type TContactUpdateResponse = {
  message: string;
  contact: TContact;
}

export type TContactDeleteResponse = {
  message: string;
}

export type TContactBulkDeleteResponse = {
  message: string;
  deletedCount: number;
}

export type TContactImportResponse = {
  message: string;
  importedCount: number;
  skippedCount?: number;
}

export type TDashboardStats = {
  allContacts?: TContact[];
  totalContacts: number;
  newThisWeek: number;
  contactsByCompany: { name: string; contacts: number }[];
  tagDistribution: { name: string; count: number }[];
  activities: number;
  activitiesByDay: Record<string, number>;
}

// API Functions
export const getAllContacts = async (
  params: TGetAllContactsParams
): Promise<TContactServiceResponse> => {
  const { search, page, limit, tag } = params;
  const queries = [];
  
  if (search) queries.push(`search=${encodeURIComponent(search)}`);
  if (page) queries.push(`page=${page}`);
  if (limit) queries.push(`limit=${limit}`);
  if (tag) queries.push(`tags=${encodeURIComponent(tag)}`);

  const queryString = queries.length > 0 ? `?${queries.join("&")}` : "";

  const response = await authenticatedFetch(`/api/contacts${queryString}`);
  const data = await response.json();
  return validateApiResponse(contactServiceResponseSchema, data);
};

export const getContactById = async (contactId: string): Promise<TContact> => {
  if (!contactId) throw new Error("Contact ID is required");

  const response = await authenticatedFetch(`/api/contacts/${contactId}`);
  const data = await response.json();
  
  if (!data.contact) {
    throw new Error("Contact not found in response");
  }

  return data.contact; // Backend returns contact in data.contact
};

export const createContact = async (contactData: TContactForm): Promise<TContactCreateResponse> => {
  const response = await authenticatedFetch("/api/contacts", {
    method: "POST",
    body: JSON.stringify({ ...contactData, user: auth.currentUser?.uid }),
  });
  
  const data = await response.json();
  return validateApiResponse(contactCreateResponseSchema, data);
};

export const updateContact = async (params: TUpdateContactParams): Promise<TContactUpdateResponse> => {
  const { contactId, contactData } = params;
  
  const response = await authenticatedFetch(`/api/contacts/${contactId}`, {
    method: "PUT",
    body: JSON.stringify(contactData),
  });
  
  const data = await response.json();
  return validateApiResponse(contactUpdateResponseSchema, data);
};

export const deleteContact = async (contactId: string): Promise<TContactDeleteResponse> => {
  const response = await authenticatedFetch(`/api/contacts/${contactId}`, {
    method: "DELETE",
  });
  
  const data = await response.json();
  return validateApiResponse(contactDeleteResponseSchema, data);
};

export const deleteMultipleContacts = async (params: TDeleteMultipleContactsParams): Promise<TContactBulkDeleteResponse> => {
  const { contactIds } = params;
  
  const response = await authenticatedFetch("/api/contacts", {
    method: "DELETE",
    body: JSON.stringify({ ids: contactIds }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to delete contacts.");
  }
  return validateApiResponse(contactBulkDeleteResponseSchema, data);
};

export const importContacts = async (params: TImportContactsParams): Promise<TContactImportResponse> => {
  const { contacts } = params;
  
  const response = await authenticatedFetch("/api/contacts/import", {
    method: "POST",
    body: JSON.stringify({ contacts }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to import contacts.");
  }
  return validateApiResponse(contactImportResponseSchema, data);
};

export const getCountOfContacts = async (): Promise<TDashboardStats> => {
  const response = await authenticatedFetch("/api/dashboard/stats");
  const data = await response.json();
  return validateApiResponse(dashboardStatsSchema, data.data);
};

// TanStack Query Hooks
export const useContacts = (
  search?: string,
  page?: number,
  limit?: number,
  tag?: string
) => {
  return useQuery({
    queryKey: [...CONTACT_QUERY_KEYS.contacts, search, page, limit, tag],
    queryFn: () => getAllContacts({ search, page, limit, tag }),
    ...createQueryConfig({}),
  });
};

export const useContact = (contactId: string) => {
  return useQuery({
    queryKey: CONTACT_QUERY_KEYS.contact(contactId),
    queryFn: () => getContactById(contactId),
    enabled: !!contactId,
    ...createQueryConfig({}),
  });
};

export const useContactStats = () => {
  return useQuery({
    queryKey: CONTACT_QUERY_KEYS.contactStats,
    queryFn: () => getCountOfContacts(),
    ...createQueryConfig({}),
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createContact,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Contact created successfully",
      queriesToInvalidate: ["contacts", "contact-stats"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to create contact" }),
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateContact,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Contact updated successfully",
      queriesToInvalidate: ["contacts", "contact-stats"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to update contact" }),
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Contact deleted successfully",
      queriesToInvalidate: ["contacts", "contact-stats"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to delete contact" }),
  });
};

export const useDeleteMultipleContacts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMultipleContacts,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Contacts deleted successfully",
      queriesToInvalidate: ["contacts", "contact-stats"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to delete contacts" }),
  });
};

export const useImportContacts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: importContacts,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Contacts imported successfully",
      queriesToInvalidate: ["contacts", "contact-stats", "activities", "paginated-activities"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to import contacts" }),
  });
};
