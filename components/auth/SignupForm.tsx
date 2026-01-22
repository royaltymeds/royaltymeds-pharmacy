"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertCircle, Loader } from "lucide-react";
import Link from "next/link";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
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
    console.log("[SignupForm] Form data:", { email, password, fullName, phone, address, dateOfBirth, role: "patient" });

    try {
      console.log("[SignupForm] Step 1: Calling /api/auth/signup-rest");

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
          role: "patient",
          phone: phone || null,
          address: address || null,
          dateOfBirth: dateOfBirth || null,
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
    <form onSubmit={handleSignup} className="space-y-3 w-full">
      {error && (
        <div className="flex items-center gap-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-xs font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
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
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-500 mt-0.5">Minimum 6 characters</p>
      </div>

      <div>
        <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
          Phone Number <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(123) 456-7890"
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-xs font-medium text-gray-700 mb-1">
          Address <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main Street"
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="dateOfBirth" className="block text-xs font-medium text-gray-700 mb-1">
          Date of Birth <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2 w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader className="w-3 h-3 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="text-center text-xs text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
