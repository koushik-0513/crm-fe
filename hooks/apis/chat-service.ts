import { auth } from "@/firebase";
import { getIdToken } from "firebase/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TChatMessage } from "@/types/global";

export type TChatResponse = {
  message: string;
  conversation: TChatMessage;
}

export type TChatDeleteResponse = {
  message: string;
}

export type TChatTitleUpdateResponse = {
  message: string;
  title: string;
}

export const getChatHistory = async (): Promise<TChatMessage[]> => {  
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chat/history`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error("Failed to fetch chat history");
  }

  const data = await response.json();
  return data.conversations || [];
};

export const getConversation = async (conversationId: string): Promise<TChatMessage> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversation/${conversationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch conversation");
  }

  const data = await response.json();
  return data.conversation;
};

export const sendChatMessage = async (
  message: string,
  conversationId: string,
  modelName?: string
): Promise<Response> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chat/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        modelName: modelName || "gpt-4o-mini",
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response;
};

export const sendChatMessageStream = async (
  message: string,
  conversationId: string,
  modelName?: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chat/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        modelName: modelName || "gpt-4o-mini",
      }),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to send message";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;
      
      if (onChunk) {
        onChunk(chunk);
      }
    }
  } catch (error) {
    console.error("Error reading stream:", error);
    throw new Error("Failed to read response stream");
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
};

export const deleteConversation = async (conversationId: string): Promise<TChatDeleteResponse> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversation/${conversationId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete conversation");
  }

  const data = await response.json();
  return data;
};

export const updateConversationTitle = async (
  conversationId: string,
  title: string
): Promise<TChatTitleUpdateResponse> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversation/${conversationId}/title`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update conversation title");
  }

  const data = await response.json();
  return data;
};

export const useChatHistory = () => {
  return useQuery({
    queryKey: ["chat-history"],
    queryFn: () => getChatHistory(),
    staleTime: 1 * 60 * 1000,
  });
};

export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
    staleTime: 30 * 1000,
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ message, conversationId, modelName }: { 
      message: string; 
      conversationId: string; 
      modelName?: string 
    }) => sendChatMessage(message, conversationId, modelName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", variables.conversationId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      toast.success("Conversation deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateConversationTitle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      updateConversationTitle(conversationId, title),
    onSuccess: (_, variables) => {
      toast.success("Conversation title updated successfully");
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", variables.conversationId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

 