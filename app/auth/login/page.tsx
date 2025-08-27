"use client";
import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/firebase"; 

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Logged in successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      toast.error(errorMessage); // changed from alert to toast
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success("Logged in with Google successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      toast.error(errorMessage); 
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription>Sign in to your CRM account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                className="bg-white/50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  className="bg-white/50 border-slate-200 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm text-slate-600">
                Remember me
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </Button>
            <div className="text-center space-y-2">
              <Link
                href="#"
                className="text-sm text-blue-600 hover:underline"
                onClick = {handleResetPassword}
              >
                Forgot your password?
              </Link>
              <p className="text-sm text-slate-600">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Register here
                </Link>
              </p>
              <p className="text-xs text-slate-500">
                <Link
                  href="/auth/usage-type"
                  className="text-blue-600 hover:underline"
                >
                  Test Usage Type Selection
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
