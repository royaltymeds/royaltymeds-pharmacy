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
      const supabase = getSupabaseClient();

      console.log("[LoginForm] Starting login for:", email);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("[LoginForm] Auth response:", { user: data.user, error: authError });

      if (authError) {
        console.error("[LoginForm] Auth error:", authError);
        setError(authError.message || "Failed to sign in");
        return;
      }

      if (!data.user) {
        console.error("[LoginForm] No user returned from login");
        setError("Login failed: No user data returned");
        return;
      }

      // Check user role and redirect accordingly
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (userError || !userData || !(userData as any)?.role) {
        console.warn("[LoginForm] Could not determine user role, redirecting to dashboard");
        router.push("/dashboard");
      } else if ((userData as any).role === "patient") {
        console.log("[LoginForm] Customer login, redirecting to customer portal");
        router.push("/patient/home");
      } else if ((userData as any).role === "doctor") {
        console.log("[LoginForm] Doctor login, redirecting to doctor dashboard");
        router.push("/doctor/dashboard");
      } else if ((userData as any).role === "admin") {
        console.log("[LoginForm] Admin login, redirecting to admin dashboard");
        router.push("/admin/dashboard");
      } else {
        console.log("[LoginForm] Unknown role, redirecting to dashboard");
        router.push("/dashboard");
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
