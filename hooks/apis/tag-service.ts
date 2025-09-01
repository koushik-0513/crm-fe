import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  authenticatedFetch, 
  createQueryConfig, 
  TAG_QUERY_KEYS,
  createMutationSuccessHandler,
  createMutationErrorHandler,
} from "@/hooks/utils/api-utils";
import type { 
  TTag, 
  TTagForm,
  TPagination
} from "@/types/global";

// ============================================================================
// TAG SERVICE SPECIFIC TYPES
// ============================================================================

export type TTagServiceResponse = {
  tags: TTag[];
  tagCounts: { [key: string]: number };
  message: string;
  pagination?: TPagination;
}

export type TTagQueryParams = {
  search?: string;
  page?: number;
  limit?: number;
}

export type TUpdateTagParams = {
  tagId: string;
  tagData: Partial<TTagForm>;
}

export type TDeleteTagParams = {
  tagId: string;
  force?: boolean;
}

export type TTagCreateResponse = {
  message: string;
  tag: TTag;
}

export type TTagUpdateResponse = {
  message: string;
  tag: TTag;
}

export type TTagDeleteResponse = {
  message: string;
}

export type TTagBulkCreateResponse = {
  message: string;
  tags: TTag[];
}

export type TTagDeleteError = {
  error: string;
  tagName: string;
  contactCount: number;
  suggestion?: string;
}

// ============================================================================
// TAG SERVICE FUNCTIONS
// ============================================================================

export const getAllTags = async (search?: string, page?: number, limit?: number): Promise<TTagServiceResponse> => {
  const queries: string[] = [];
  
  if (search) queries.push(`search=${encodeURIComponent(search)}`);
  if (page) queries.push(`page=${page}`);
  if (limit) queries.push(`limit=${limit}`);

  const queryString = queries.length > 0 ? `?${queries.join("&")}` : "";

  const response = await authenticatedFetch(`/api/tags${queryString}`);
  const data = await response.json();
  return data.data;
};

export const createTag = async (tagData: TTagForm): Promise<TTagCreateResponse> => {
  const response = await authenticatedFetch("/api/tags", {
    method: "POST",
    body: JSON.stringify(tagData),
  });
  
  const data = await response.json();
  return data;
};

export const updateTag = async (params: TUpdateTagParams): Promise<TTagUpdateResponse> => {
  const { tagId, tagData } = params;
  
  const response = await authenticatedFetch(`/api/tags/${tagId}`, {
    method: "PUT",
    body: JSON.stringify(tagData),
  });
  
  const data = await response.json();
  return data;
};

export const deleteTag = async (params: TDeleteTagParams): Promise<TTagDeleteResponse | TTagDeleteError> => {
  const { tagId, force = false } = params;
  
  const queryParams = force ? `?force=true` : '';
  const response = await authenticatedFetch(`/api/tags/${tagId}${queryParams}`, {
    method: "DELETE",
  });
  
  const data = await response.json();
  return data;
};

export const bulkCreateTags = async (tags: TTagForm[]): Promise<TTagBulkCreateResponse> => {
  const response = await authenticatedFetch("/api/tags/bulk-add", {
    method: "POST",
    body: JSON.stringify({ tags }),
  });
  
  const data = await response.json();
  return data;
};



// TanStack Query Hooks
export const useTags = (
  search?: string,
  page?: number,
  limit?: number
) => {
  return useQuery({
    queryKey: [...TAG_QUERY_KEYS.tags, search, page, limit],
    queryFn: () => getAllTags(search, page, limit),
    enabled: !!page && !!limit, // Only fetch when required parameters are available
    ...createQueryConfig({ staleTime: 5 * 60 * 1000 }), // 5 minutes stale time to prevent unnecessary refetches
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTag,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Tag created successfully",
      queriesToInvalidate: ["tags"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to create tag" }),
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateTag,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Tag updated successfully",
      queriesToInvalidate: ["tags"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to update tag" }),
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Tag deleted successfully",
      queriesToInvalidate: ["tags"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to delete tag" }),
  });
};

export const useBulkCreateTags = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: bulkCreateTags,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Tags created successfully",
      queriesToInvalidate: ["tags"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to create tags" }),
  });
};
