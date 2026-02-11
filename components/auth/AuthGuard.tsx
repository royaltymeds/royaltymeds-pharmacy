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

  // Check if we just came from the auth callback (within last 10 seconds)
  // In this case, we give the session more time to initialize
  const isRecentAuth = typeof window !== "undefined" && 
    (Date.now() - (parseInt(sessionStorage.getItem("auth-time") || "0") || 0)) < 10000;

  useEffect(() => {
    async function checkAuth(attempt = 0) {
      try {
        // console.log(`[AuthGuard] Checking auth status (attempt ${attempt + 1})${isRecentAuth ? " (recent auth)" : ""}...`);
        const supabase = getSupabaseClient();
        
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // console.log("[AuthGuard] Session status:", session ? "active" : "none");

        if (!session) {
          // On StackBlitz, session might not be ready immediately after redirect
          // Retry up to 3 times on recent auth (more for recent auths)
          const maxAttempts = isRecentAuth ? 3 : 2;
          
          if (attempt < maxAttempts) {
            const delay = isRecentAuth ? 600 : 500; // Longer delay for recent auth
            // console.log(`[AuthGuard] No session found, retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return checkAuth(attempt + 1);
          }
          
          // console.log("[AuthGuard] No session after retries, redirecting to /login");
          router.push("/login");
          return;
        }

        // console.log("[AuthGuard] Session active, showing content");
        setIsReady(true);
      } catch (error) {
        console.error("[AuthGuard] Error checking auth:", error);
        
        const maxAttempts = isRecentAuth ? 3 : 2;
        if (attempt < maxAttempts) {
          const delay = isRecentAuth ? 600 : 500;
          // console.log(`[AuthGuard] Error checking auth, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return checkAuth(attempt + 1);
        }
        router.push("/login");
      }
    }

    checkAuth();
  }, [router, isRecentAuth]);

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
