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
    async function checkAuth(attempt = 0) {
      try {
        console.log(`[AuthGuard] Checking auth status (attempt ${attempt + 1})...`);
        const supabase = getSupabaseClient();
        
        // Check localStorage first as a quick indicator
        const session = localStorage.getItem("sb-session");
        console.log("[AuthGuard] Session in localStorage:", session ? "found" : "not found");
        
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log("[AuthGuard] Auth status:", user ? "authenticated" : "not authenticated");

        if (!user) {
          // On StackBlitz, session might not be ready immediately after redirect
          // Retry after a small delay on first attempt
          if (attempt < 2) {
            console.log("[AuthGuard] No user found, retrying in 500ms...");
            await new Promise(resolve => setTimeout(resolve, 500));
            return checkAuth(attempt + 1);
          }
          
          console.log("[AuthGuard] No user after retries, redirecting to /login");
          router.push("/login");
          return;
        }

        console.log("[AuthGuard] User authenticated, showing content");
        setIsReady(true);
      } catch (error) {
        console.error("[AuthGuard] Error checking auth:", error);
        // Don't immediately redirect on error, as it might be a transient issue
        if (attempt < 2) {
          console.log("[AuthGuard] Error checking auth, retrying in 500ms...");
          await new Promise(resolve => setTimeout(resolve, 500));
          return checkAuth(attempt + 1);
        }
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
