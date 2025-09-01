"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithPopup,
  getIdToken,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

// Use env var or fallback - support both local and production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? "https://your-backend-url.herokuapp.com" // Replace with your actual backend URL
    : "http://localhost:5000");

// 🔹 Define context types
type TAuthContextType = {
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: "admin" | "user") => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

type TSyncUserRequest = {
  uid: string;
  email: string | null;
  name: string | null;
}

// 🔹 Create context with undefined as initial value
const AuthContext = createContext<TAuthContextType | undefined>(undefined);

// 🔹 useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// 🔹 AuthProvider Props type
type TAuthProviderProps = {
  children: ReactNode;
}

export const AuthProvider = ({ children }: TAuthProviderProps) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const lastSyncedUid = useRef<string | null>(null);
  const isNewRegistration = useRef<boolean>(false);
  const skipAutoRedirect = useRef<boolean>(false);

  // 🔹 Sync Firebase user on change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged triggered:", firebaseUser?.email);
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        try {
          // Force token refresh to ensure it's valid
          const token = await getIdToken(firebaseUser, true);
          setTokenCookie(token);
          
          // Skip sync if we're handling redirect manually (during registration)
          if (skipAutoRedirect.current) {
            console.log("Skipping auto redirect as it's handled manually");
            skipAutoRedirect.current = false;
            return;
          }
          
          // Only sync if we haven't synced this user before or if the UID changed
          if (lastSyncedUid.current !== firebaseUser.uid) {
            lastSyncedUid.current = firebaseUser.uid;
            console.log("Syncing user to backend...");
            await syncUserToBackend(firebaseUser, token);
          }
        } catch (error: unknown) {
          console.error("Error syncing user:", error);
        }
      } else {
        removeTokenCookie();
        lastSyncedUid.current = null;
        isNewRegistration.current = false;
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Sync to backend
  const syncUserToBackend = async (firebaseUser: FirebaseUser, token: string, forceRedirect?: boolean) => {
    try {
      console.log("Starting backend sync for user:", firebaseUser.email);
      console.log("isNewRegistration flag:", isNewRegistration.current);
      console.log("forceRedirect flag:", forceRedirect);
      
      // Check if there's a temporary role from registration
      const tempRole = localStorage.getItem("tempRole");
      console.log("Temp role from localStorage:", tempRole);
      
      const body: TSyncUserRequest & { role?: string } = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
      };
      
      // Add role if it exists (from new registration)
      if (tempRole) {
        body.role = tempRole;
        localStorage.removeItem("tempRole"); // Clean up
      }
      
      console.log("Sending request to backend with body:", body);
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      console.log("Backend response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Full backend sync response:", JSON.stringify(data, null, 2));
        
        // Determine if user is new based on multiple factors
        const isNew = data.data?.isNew || 
                     data.isNew || 
                     isNewRegistration.current || 
                     tempRole !== null; // If we had a temp role, it's a new registration
        
        console.log("Is user new?", isNew);
        console.log("Force redirect?", forceRedirect);
        console.log("Has completed setup?", data.data?.hasCompletedSetup);
        
        // Get current path
        const currentPath = window.location.pathname;
        const isOnSetupPage = currentPath.includes('/auth/usage-type');
        const isOnDashboard = currentPath.includes('/dashboard');
        const isOnAuthPage = currentPath.includes('/auth/');
        
        // Handle redirection - only redirect if necessary
        if (forceRedirect) {
          // Only redirect on explicit actions (login, register, Google login)
          if (isNew) {
            console.log("Redirecting NEW user to /auth/usage-type");
            router.push("/auth/usage-type");
          } else if (data.data?.hasCompletedSetup === false) {
            // Check if user explicitly hasn't completed setup
            console.log("User hasn't completed setup, redirecting to /auth/usage-type");
            router.push("/auth/usage-type");
          } else {
            // User has completed setup or backend doesn't track it
            console.log("Redirecting to /dashboard");
            router.push("/dashboard");
          }
        } else {
          // Auto-sync on page reload - don't redirect if user is already where they should be
          console.log("Auto-sync: Current path:", currentPath);
          
          // Only redirect if user is on an auth page (like login/register) but shouldn't be
          if (isOnAuthPage && !isOnSetupPage) {
            // User is on login/register page but is already authenticated
            if (isNew || data.data?.hasCompletedSetup === false) {
              router.push("/auth/usage-type");
            } else {
              router.push("/dashboard");
            }
          }
          // If user is already on dashboard or setup page, don't redirect
        }
        
        // Reset the registration flag
        isNewRegistration.current = false;
      } else {
        console.error("Backend sync failed with status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        
        // If backend sync fails but we know it's a new registration, still redirect
        if (isNewRegistration.current) {
          console.log("Backend sync failed but redirecting new user to /auth/usage-type anyway");
          router.push("/auth/usage-type");                                
          isNewRegistration.current = false;
        }
      }
    } catch (err: unknown) {
      console.error("Backend sync failed with error:", err);
      
      // If backend is down but we know it's a new registration, still redirect
      if (isNewRegistration.current) {
        console.log("Backend error but redirecting new user to /auth/usage-type anyway");
        router.push("/auth/usage-type");
        isNewRegistration.current = false;
      }
    }
  };

  const setTokenCookie = (token: string) => {
    Cookies.set("token", token, { path: "/", sameSite: "strict" });
  };

  const removeTokenCookie = () => {
    Cookies.remove("token", { path: "/" });
  };

  const register = async (email: string, password: string, name: string, role: "admin" | "user") => {
    try {
      console.log("========== REGISTRATION STARTED ==========");
      console.log("Register function called with:", { email, name, role });
      
      // Set flags for new registration
      isNewRegistration.current = true;
      skipAutoRedirect.current = true;
      
      // Store role for backend sync
      localStorage.setItem("tempRole", role);
      console.log("Stored temp role:", role);
      
      // Create Firebase user
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Firebase user created successfully:", userCred.user.email);
      
      // Update profile with display name
      await updateProfile(userCred.user, { displayName: name });
      console.log("Profile updated with display name:", name);
      
      // Get token and set cookie
      const token = await getIdToken(userCred.user, true);
      setTokenCookie(token);
      console.log("Token obtained and cookie set");
      
      // Set user state
      setUser(userCred.user);
      console.log("User state updated");
      
      // Manually sync and redirect immediately for registration
      console.log("Manually syncing to backend and forcing redirect...");
      await syncUserToBackend(userCred.user, token, true);
      
      // Fallback: If syncUserToBackend didn't redirect for some reason, do it here
      setTimeout(() => {
        if (!window.location.pathname.includes('/auth/usage-type') && 
            !window.location.pathname.includes('/dashboard')) {
          console.log("Fallback redirect to /auth/usage-type");
          router.push("/auth/usage-type");
        }
      }, 1000);
      
      console.log("========== REGISTRATION COMPLETED ==========");
      
    } catch (error) {
      console.error("Registration error:", error);
      isNewRegistration.current = false;
      skipAutoRedirect.current = false;
      localStorage.removeItem("tempRole");
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("========== LOGIN STARTED ==========");
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await getIdToken(userCred.user, true);
      setTokenCookie(token);
      console.log("Login successful, token set");
      
      // Manually trigger sync for immediate redirect
      await syncUserToBackend(userCred.user, token, true);
      console.log("========== LOGIN COMPLETED ==========");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      console.log("========== GOOGLE LOGIN STARTED ==========");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await getIdToken(user, true);
      setTokenCookie(token);
      console.log("Google login successful, token set");
      
      // Manually trigger sync for immediate redirect
      await syncUserToBackend(user, token, true);
      console.log("========== GOOGLE LOGIN COMPLETED ==========");
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      removeTokenCookie();
      localStorage.removeItem("tempRole"); // Clean up any temp data
      router.push("/auth/login");
    } catch (err: unknown) {
      alert("Logout failed: " + err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};