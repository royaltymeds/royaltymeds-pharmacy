"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertCircle, Loader } from "lucide-react";
import Link from "next/link";

type UserRole = "patient" | "doctor" | "admin";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Log form data
    console.log("[SignupForm] ========== FORM SUBMISSION ==========");
    console.log("[SignupForm] Form data:", { email, password, fullName, role });

    try {
      console.log("[SignupForm] Step 1: Calling /api/auth/signup");

      // Step 1: Create auth user via server API (using REST API directly)
      const signupResponse = await fetch("/api/auth/signup-rest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log("[SignupForm] Step 1 response status:", signupResponse.status);
      console.log("[SignupForm] Step 1 response ok:", signupResponse.ok);

      const signupText = await signupResponse.text();
      console.log("[SignupForm] Step 1 response text:", signupText);

      let signupData;
      try {
        signupData = JSON.parse(signupText);
      } catch (e) {
        console.error("[SignupForm] Failed to parse signup response:", e);
        setError("Invalid response from signup API");
        return;
      }

      if (!signupResponse.ok) {
        console.error("[SignupForm] Signup error:", signupData);
        setError(signupData.error || "Failed to sign up");
        return;
      }

      const userId = signupData.user?.id;
      console.log("[SignupForm] Auth user ID:", userId);

      if (!userId) {
        console.error("[SignupForm] No user ID in response:", signupData);
        setError("Signup failed: No user data returned");
        return;
      }

      console.log("[SignupForm] Step 2: Calling /api/auth/create-profile");

      // Step 2: Create user profile via API endpoint
      const profileResponse = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          fullName,
          email,
          role,
        }),
      });

      console.log("[SignupForm] Step 2 response status:", profileResponse.status);

      if (!profileResponse.ok) {
        const profileError = await profileResponse.json();
        console.error("[SignupForm] Profile creation error:", profileError);
        setError(profileError.error || "Failed to create profile");
        return;
      }

      console.log("[SignupForm] SUCCESS: Signup complete, redirecting to login");
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("[SignupForm] EXCEPTION:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <form onSubmit={handleSignup} className="space-y-4 w-full">
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          minLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          I am a...
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
