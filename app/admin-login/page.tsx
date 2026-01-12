"use client";

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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Check if user is admin
      if (data.role !== "admin") {
        setError("Only administrators can access this area");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Admin Badge */}
      <div className="absolute top-4 right-4">
        <span className="px-4 py-2 bg-slate-700 text-slate-100 text-xs font-bold rounded-full uppercase tracking-wider">
          Admin Only
        </span>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8">
          {/* Admin Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4 p-3 bg-slate-700 rounded-lg">
              <svg className="w-8 h-8 text-slate-100" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5m-15-4h10m-10 3h10m-10 3h10M17 1.5v6m-3-3h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-100">Administrator</h1>
            <p className="text-slate-400 mt-2">RoyaltyMeds Admin Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@royaltymeds.com"
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 transition flex items-center justify-center gap-2 mt-6"
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

          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-center text-sm text-slate-400">
              Not an administrator?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                User Login
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 text-center">
              This is a restricted area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
