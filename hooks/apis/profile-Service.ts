import { auth } from "@/firebase";
import { getIdToken } from "firebase/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { 
  TUser
} from "@/types/global";
import { validateApiResponse, profileResponseSchema, profileUpdateResponseSchema, profileDeleteResponseSchema } from "@/types/validation-Schemas";

// ============================================================================
// PROFILE SERVICE SPECIFIC TYPES
// ============================================================================

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

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/profile`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  const data = await response.json();
  const validatedData = validateApiResponse(profileResponseSchema, data);
  return validatedData.user as TUser; // Backend returns user data in data.user
};

export const updateUserProfile = async (profileData: Partial<TUser>): Promise<TProfileUpdateResponse> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const token = await getIdToken(currentUser);

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
    throw new Error("Failed to update user profile");
  }

  const data = await response.json();
  return validateApiResponse(profileUpdateResponseSchema, data);
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
  return validateApiResponse(profileDeleteResponseSchema, data);
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
      toast.error("Failed to update profile");
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