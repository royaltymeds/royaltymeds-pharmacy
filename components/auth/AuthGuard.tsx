"use client";

import { getSupabaseClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log("[AuthGuard] Checking auth status...");
        const supabase = getSupabaseClient();
        
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log("[AuthGuard] Auth status:", user ? "authenticated" : "not authenticated");

        if (!user) {
          console.log("[AuthGuard] No user, redirecting to /login");
          router.push("/login");
          return;
        }

        console.log("[AuthGuard] User authenticated, showing content");
        setIsReady(true);
      } catch (error) {
        console.error("[AuthGuard] Error checking auth:", error);
        router.push("/login");
      }
    }

    checkAuth();
  }, [router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
