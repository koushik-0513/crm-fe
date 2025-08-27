"use client";
import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type TAuthMiddlewareProps = {
    children: React.ReactNode;
}

export default function authMiddleware({ children }: TAuthMiddlewareProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return user ? children : null;
}





