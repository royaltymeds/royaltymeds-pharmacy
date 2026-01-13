"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";

/**
 * This page is an intermediate page between login and the actual portal.
 * It's essential for SSR with Supabase + Next.js to work correctly.
 *
 * WHY THIS MATTERS:
 * When using route prefetching, Next.js can send server-side requests BEFORE
 * the browser's Supabase client processes the access/refresh tokens from the URL.
 * This causes the portal pages to think the user is not logged in.
 *
 * SOLUTION:
 * This page has NO <Link> components (which trigger prefetching).
 * It allows the client-side Supabase library to fully initialize and store tokens.
 * Then it redirects to the actual portal page.
 *
 * Reference: https://supabase.com/docs/guides/auth/server-side-rendering
 */
function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "patient";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Wait for the client-side Supabase library to fully process tokens
    // This is critical on platforms like StackBlitz where async context is limited
    // Increase delay to ensure session is properly initialized
    const timer = setTimeout(() => {
      const redirectUrl =
        role === "doctor"
          ? "/doctor/dashboard"
          : role === "admin"
            ? "/admin/dashboard"
            : "/patient/home";

      console.log("[AuthSuccess] Redirecting to portal:", redirectUrl);
      
      // Use standard window.location for final redirect to ensure clean navigation
      // This is a one-time redirect, not repeated navigation
      router.push(redirectUrl);
    }, 800); // Increased delay to ensure token processing on StackBlitz

    return () => clearTimeout(timer);
  }, [mounted, role, router]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Signing you in...</h1>
        <p className="text-gray-600">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          </div>
        </div>
      }
    >
      <AuthSuccessContent />
    </Suspense>
  );
}
