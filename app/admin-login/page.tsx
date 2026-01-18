"use client";

import { getSupabaseClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertCircle, Loader } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
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

      // Sign in with Supabase Auth (this sets the session cookie)
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Login failed");
        return;
      }

      if (!data.user) {
        setError("Login failed: No user data returned");
        return;
      }

      // Check if user is admin by reading from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (userError || !userData) {
        setError("Failed to verify admin status");
        return;
      }

      const userRole = (userData as any)?.role;

      // Check if user is admin
      if (userRole !== "admin") {
        setError("Only pharmacists can access this area");
        // Sign out the non-admin user
        await supabase.auth.signOut();
        return;
      }

      // Redirect to success page (no prefetching) to allow token processing
      // See: https://supabase.com/docs/guides/auth/server-side-rendering#no-session-on-the-server-side-with-nextjs-route-prefetching
      router.push("/auth/success?role=admin");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      {/* Back to Homepage */}
      <Link href="/" className="absolute top-4 left-4 text-green-600 hover:text-green-700 font-medium text-sm">
        ← Back to Homepage
      </Link>

      {/* Admin Badge */}
      <div className="absolute top-4 right-4">
        <span className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
          Pharmacist Only
        </span>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-8">
          {/* Admin Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4 p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5m-15-4h10m-10 3h10m-10 3h10M17 1.5v6m-3-3h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Pharmacist Portal</h1>
            <p className="text-gray-600 mt-2">RoyaltyMeds Pharmacy Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pharmacist@royaltymeds.com"
                required
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2 w-full sm:w-auto"
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
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Not a pharmacist?{" "}
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                User Login
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              This is a restricted area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
