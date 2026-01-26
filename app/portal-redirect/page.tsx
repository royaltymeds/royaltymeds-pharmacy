"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase-client";

export default function PortalRedirectPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkUserAndRedirect = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        // If not logged in, go to admin login (pharmacist portal)
        if (!session) {
          router.push("/admin-login");
          return;
        }

        // Get user role from database
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const userRole = (userData as any)?.role || "patient";

        // Redirect to appropriate dashboard based on role
        const redirectUrl =
          userRole === "doctor"
            ? "/doctor/dashboard"
            : userRole === "admin"
              ? "/admin/dashboard"
              : "/patient/home";

        router.push(redirectUrl);
      } catch (err) {
        console.error("[PortalRedirect] Error checking user:", err);
        // Default to admin login on error
        router.push("/admin-login");
      }
    };

    checkUserAndRedirect();
  }, [mounted, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we process your request.</p>
      </div>
    </div>
  );
}
