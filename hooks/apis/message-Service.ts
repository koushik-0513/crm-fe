import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch, createMutationSuccessHandler, createMutationErrorHandler } from "@/hooks/utils/api-Utils";
import type { TContact, TMessageHistory } from "@/types/global";

// ============================================================================
// MESSAGE SERVICE SPECIFIC TYPES
// ============================================================================

export type TGenerateMessageRequest = {
  prompt: string;
  contactIds: string[];
  model?: string;
}

export type TSendMessageRequest = {
  messageContent: string;
  contactIds: string[];
  prompt: string;
}

export type TGeneratedMessage = {
  contactId: string;
  contactName: string;
  phoneNumber: string;
  success: boolean;
  messages: TMessageHistory[];
  context?: Array<{
    type: 'contact' | 'activity' | 'tag';
    data: Record<string, unknown>;
  }>;
  error?: string;
}

export type TSendMessageResult = {
  contactId: string;
  contactName: string;
  phoneNumber: string;
  success: boolean;
  messageId?: string;
  waId?: string;
  error?: string;
}

// API Functions
export const generate_messages = async (request: TGenerateMessageRequest): Promise<{ success: boolean; results: TGeneratedMessage[] }> => {
  const response = await authenticatedFetch("/api/messages/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
  return response.json();
};

export const send_message = async (request: TSendMessageRequest): Promise<{ success: boolean; results: TSendMessageResult[] }> => {
  const response = await authenticatedFetch("/api/messages/send", {
    method: "POST",
    body: JSON.stringify(request),
  });
  return response.json();
};

// TanStack Query Hooks
export const use_generate_messages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: generate_messages,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Messages generated successfully",
      queriesToInvalidate: ["message-history"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to generate messages" }),
  });
};

export const use_send_message = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: send_message,
    onSuccess: createMutationSuccessHandler({
      queryClient,
      successMessage: "Messages sent successfully",
      queriesToInvalidate: ["message-history"]
    }),
    onError: createMutationErrorHandler({ defaultMessage: "Failed to send messages" }),
  });
};