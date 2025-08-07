"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
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

// Use env var or fallback
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// 🔹 Define context types
type TAuthContextType = {
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
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

  // 🔹 Sync Firebase user on change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        try {
          // Force token refresh to ensure it's valid
          const token = await getIdToken(firebaseUser, true);
          setTokenCookie(token);
          await syncUserToBackend(firebaseUser, token);
        } catch (error: unknown) {
          console.error("Error syncing user:", error);
        }
      } else {
        removeTokenCookie();
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Sync to backend
  const syncUserToBackend = async (firebaseUser: FirebaseUser, token: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        }),
      });
    } catch (err: unknown) {
      console.error("Backend sync failed:", err);
    }
  };

  const setTokenCookie = (token: string) => {
    Cookies.set("token", token, { path: "/dashboard", sameSite: "strict" });
  };

  const removeTokenCookie = () => {
    Cookies.remove("token", { path: "/dashboard" });
  };

  const register = async (email: string, password: string, name: string) => {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(userCred.user, { displayName: name });
    const token = await getIdToken(userCred.user, true);
    setTokenCookie(token);
    await syncUserToBackend(userCred.user, token);
  };

  const login = async (email: string, password: string) => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const token = await getIdToken(userCred.user, true);
    setTokenCookie(token);
    await syncUserToBackend(userCred.user, token);
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user.email) {
      router.push("/dashboard");
    }
    const token = await getIdToken(user, true);
    setTokenCookie(token);
    await syncUserToBackend(user, token);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      removeTokenCookie();
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
