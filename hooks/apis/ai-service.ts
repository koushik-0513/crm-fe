import { auth } from "@/firebase";
import { getIdToken } from "firebase/auth";
import { useQuery } from "@tanstack/react-query";
import type { TAIModel } from "@/types/global";

// API Functions
export const getAvailableModels = async (): Promise<TAIModel[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/ai/models`,
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
    throw new Error("Failed to fetch available models");
  }

  const data = await response.json();
  return data.models || [];
};

// TanStack Query Hooks
export const useAvailableModels = () => {
  return useQuery({
    queryKey: ["available-models"],
    queryFn: () => getAvailableModels(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};