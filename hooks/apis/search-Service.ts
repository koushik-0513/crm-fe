import { auth } from "@/firebase";
import { getIdToken } from "firebase/auth";
import { useQuery } from "@tanstack/react-query";
import type { TSearchResults } from "@/types/global";

// API Functions
export const searchData = async (query: string): Promise<TSearchResults> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    } 
  );

  if (!response.ok) {
    throw new Error("Failed to search data");
  }

  const data = await response.json();
  return data;
};

// TanStack Query Hooks
export const useSearch = (query: string) => {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchData(query),
    enabled: !!query && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};