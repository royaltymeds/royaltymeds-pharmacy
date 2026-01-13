"use client";

import { getSupabaseClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "patient" | "doctor" | "admin";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log("[AuthGuard] No user found, redirecting to login");
          router.push("/login");
          return;
        }

        // If a specific role is required, check it
        if (requiredRole) {
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          const userRole = (userData as any)?.role || "patient";

          if (userRole !== requiredRole) {
            console.log(`[AuthGuard] User role ${userRole} != required ${requiredRole}`);
            router.push("/login");
            return;
          }
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("[AuthGuard] Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
