import { auth } from "@/firebase";
import { getIdToken } from "firebase/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { 
  TUser
} from "@/types/global";


export type TProfileUpdateResponse = {
  message: string;
  user: TUser;
}

export type TProfileDeleteResponse = {
  message: string;
}

// API Functions
export const getUserProfile = async (): Promise<TUser> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  console.log("Fetching user profile from:", `${apiUrl}/api/profile`);

  try {
    const response = await fetch(
      `${apiUrl}/api/profile`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Profile fetch failed:", response.status, response.statusText);
      throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Profile data received:", data);
    
    // Backend returns { user: { ... } }, so we need to extract the user object
    return data.user as TUser;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    throw error;
  }
};

export const updateUserProfile = async (profileData: Partial<TUser>): Promise<TProfileUpdateResponse> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/profile`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update user profile");
  }
};

export const updateWalkthroughStatus = async (page_name: string, completed: boolean) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");
  const token = await getIdToken(currentUser);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/walkthrough`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ page_name, completed })
  });

  if (!response.ok) {
    throw new Error("Failed to update walkthrough status");
  }

  const data = await response.json();
  return data;
};

export const deleteUserAccount = async (): Promise<TProfileDeleteResponse> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/profile`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete user account");
  }

  const data = await response.json();
  return data;
};

// TanStack Query Hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
    },
  });
};

export const useDeleteUserAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Account deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete account");
    },
  });
};

export const useUpdateWalkthroughStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ page_name, completed }: { page_name: string; completed: boolean }) => updateWalkthroughStatus(page_name, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (error) => {
      toast.error("Failed to update walkthrough status");
    },
  });
};