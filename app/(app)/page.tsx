"use client";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/apis/user-service";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    console.log("Home page useEffect - loading:", loading, "user:", user, "profileLoading:", profileLoading, "userProfile:", userProfile);
    
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to login
        console.log("No user, redirecting to login");
        router.push("/auth/login");
      } else if (!profileLoading && userProfile) {
        console.log("User profile:", userProfile); // Debug log
        if (!userProfile.role) {
          // User doesn't have a role, redirect to usage type selection
          console.log("No role found, redirecting to usage type selection"); // Debug log
          router.push("/auth/usage-type");
        } else {
          // User has a role, redirect to dashboard
          console.log("Role found:", userProfile.role, "redirecting to dashboard"); // Debug log
          router.push("/dashboard");
        }
      } else if (!profileLoading && !userProfile) {
        // Profile loading failed or user doesn't exist in backend
        console.log("No user profile found, redirecting to usage type selection");
        router.push("/auth/usage-type");
      }
    }
  }, [user, loading, userProfile, profileLoading, router]);

  // Show loading while checking authentication and role
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}
