import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  authenticatedFetch, 
  createQueryConfig, 
  TAG_QUERY_KEYS,
  createMutationSuccessHandler,
  createMutationErrorHandler,
  invalidateQueries
} from "@/hooks/utils/api-Utils";
import type { 
  TTag, 
  TTagForm,
  TPagination
} from "@/types/global";
import { validateApiResponse, tagServiceResponseSchema, tagCreateResponseSchema, tagUpdateResponseSchema, tagDeleteResponseSchema, tagDeleteErrorSchema, tagBulkCreateResponseSchema } from "@/types/validation-Schemas";

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
  tagData: { name: string; color: string };
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
  contactCount?: number;
  tagName?: string;
}

export type TTagBulkCreateResponse = {
  message: string;
  tags: TTag[];
}

export type TTagDeleteError = {
  success: false;
  error: string;
  contactCount: number;
  tagName: string;
}

// API Functions
export const getAllTags = async (
  search?: string,
  page?: number,
  limit?: number
): Promise<TTagServiceResponse> => {
  const queries = [];
  
  if (search) queries.push(`search=${encodeURIComponent(search)}`);
  if (page) queries.push(`page=${page}`);
  if (limit) queries.push(`limit=${limit}`);

  const queryString = queries.length > 0 ? `?${queries.join("&")}` : "";

  const response = await authenticatedFetch(`/api/tags${queryString}`);
  const data = await response.json();
  return validateApiResponse(tagServiceResponseSchema, data);
};

export const createTag = async (tagData: TTagForm): Promise<TTagCreateResponse> => {
  const response = await authenticatedFetch("/api/tags", {
    method: "POST",
    body: JSON.stringify(tagData),
  });
  
  const data = await response.json();
  return validateApiResponse(tagCreateResponseSchema, data);
};

export const updateTag = async (params: TUpdateTagParams): Promise<TTagUpdateResponse> => {
  const { tagId, tagData } = params;
  
  const response = await authenticatedFetch(`/api/tags/${tagId}`, {
    method: "PUT",
    body: JSON.stringify(tagData),
  });
  
  const data = await response.json();
  return validateApiResponse(tagUpdateResponseSchema, data);
};

export const deleteTag = async (params: TDeleteTagParams): Promise<TTagDeleteResponse | TTagDeleteError> => {
  const { tagId, force = false } = params;
  
  const response = await authenticatedFetch(`/api/tags/${tagId}`, {
    method: "DELETE",
    body: JSON.stringify({ force }),
  });
  
  const data = await response.json();
  return validateApiResponse(tagDeleteResponseSchema, data);
};

export const bulkCreateTags = async (tags: TTagForm[]): Promise<TTagBulkCreateResponse> => {
  const response = await authenticatedFetch("/api/tags/bulk", {
    method: "POST",
    body: JSON.stringify({ tags }),
  });
  
  const data = await response.json();
  return validateApiResponse(tagBulkCreateResponseSchema, data);
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
    ...createQueryConfig({}),
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
