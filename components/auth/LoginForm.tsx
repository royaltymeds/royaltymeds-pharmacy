"use client";

import { getSupabaseClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertCircle, Loader } from "lucide-react";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("[LoginForm] Starting login for:", email);

      const supabase = getSupabaseClient();

      // Step 1: Authenticate with Supabase (sets client-side session)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("[LoginForm] Auth response:", { user: authData.user?.id, error: authError });

      if (authError) {
        console.error("[LoginForm] Auth error:", authError);
        setError(authError.message || "Failed to sign in");
        return;
      }

      if (!authData.user?.id) {
        console.error("[LoginForm] No user returned from login");
        setError("Login failed: No user data returned");
        return;
      }

      // Step 2: Get user role from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (userError) {
        console.warn("[LoginForm] Could not get user role:", userError);
      }

      const userRole = (userData as any)?.role || "patient";
      console.log("[LoginForm] User authenticated with role:", userRole);

      // Step 3: Redirect based on role
      if (userRole === "patient") {
        console.log("[LoginForm] Patient login, redirecting to patient home");
        router.push("/patient/home");
      } else if (userRole === "doctor") {
        console.log("[LoginForm] Doctor login, redirecting to doctor dashboard");
        router.push("/doctor/dashboard");
      } else if (userRole === "admin") {
        console.log("[LoginForm] Admin login, redirecting to admin dashboard");
        router.push("/admin/dashboard");
      } else {
        console.log("[LoginForm] Unknown role, defaulting to patient home");
        router.push("/patient/home");
      }
      
      router.refresh();
    } catch (err) {
      console.error("[LoginForm] Unexpected error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <form onSubmit={handleLogin} className="space-y-4 w-full">
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-green-600 hover:text-green-700">
          Forgot password?
        </Link>
        <span className="text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-green-600 hover:text-green-700 font-medium">
            Sign up
          </Link>
        </span>
      </div>
    </form>
  );
}
