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
  const [streetLine1, setStreetLine1] = useState("");
  const [streetLine2, setStreetLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Jamaica");
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
    // console.log("[SignupForm] ========== FORM SUBMISSION ==========");
    // console.log("[SignupForm] Form data:", { email, password, fullName, phone, streetLine1, streetLine2, city, state, postalCode, country, dateOfBirth, role: "patient" });

    try {
      // Validate required fields
      if (!phone || phone.trim() === "") {
        setError("Phone number is required");
        setIsLoading(false);
        return;
      }

      if (!streetLine1 || streetLine1.trim() === "") {
        setError("Street address is required");
        setIsLoading(false);
        return;
      }

      if (!city || city.trim() === "") {
        setError("City is required");
        setIsLoading(false);
        return;
      }

      if (!state || state.trim() === "") {
        setError("State/Province is required");
        setIsLoading(false);
        return;
      }

      if (!postalCode || postalCode.trim() === "") {
        setError("Postal code is required");
        setIsLoading(false);
        return;
      }

      if (!country || country.trim() === "") {
        setError("Country is required");
        setIsLoading(false);
        return;
      }

      if (!dateOfBirth || dateOfBirth.trim() === "") {
        setError("Date of birth is required");
        setIsLoading(false);
        return;
      }

      // console.log("[SignupForm] Step 0: Checking for existing user with email or phone");

      // Step 0: Check if user already exists
      const checkResponse = await fetch("/api/auth/check-existing-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          phone,
        }),
      });

      const checkData = await checkResponse.json();
      // console.log("[SignupForm] Check response:", checkData);

      if (checkData.exists) {
        let errorMessage = "";
        if (checkData.emailExists && checkData.phoneExists) {
          errorMessage = "This email and phone number are already registered in our system.";
        } else if (checkData.emailExists) {
          errorMessage = "This email is already registered in our system.";
        } else if (checkData.phoneExists) {
          errorMessage = "This phone number is already registered in our system.";
        }
        console.warn("[SignupForm] User already exists:", errorMessage);
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // console.log("[SignupForm] Step 1: Calling /api/auth/signup-rest");

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

      // console.log("[SignupForm] Step 1 response status:", signupResponse.status);
      // console.log("[SignupForm] Step 1 response ok:", signupResponse.ok);

      const signupText = await signupResponse.text();
      // console.log("[SignupForm] Step 1 response text:", signupText);

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
      // console.log("[SignupForm] Auth user ID:", userId);

      if (!userId) {
        console.error("[SignupForm] No user ID in response:", signupData);
        setError("Signup failed: No user data returned");
        return;
      }

      // console.log("[SignupForm] Step 2: Calling /api/auth/create-profile");

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
          phone,
          streetLine1,
          streetLine2: streetLine2 || null,
          city,
          state,
          postalCode,
          country,
          dateOfBirth,
        }),
      });

      // console.log("[SignupForm] Step 2 response status:", profileResponse.status);

      if (!profileResponse.ok) {
        const profileError = await profileResponse.json();
        console.error("[SignupForm] Profile creation error:", profileError);
        setError(profileError.error || "Failed to create profile");
        return;
      }

      // console.log("[SignupForm] SUCCESS: Signup complete, redirecting to login");
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
          Full Name <span className="text-red-500">*</span>
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
          Email Address <span className="text-red-500">*</span>
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
          Password <span className="text-red-500">*</span>
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
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(123) 456-7890"
          required
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="streetLine1" className="block text-xs font-medium text-gray-700 mb-1">
          Street Address <span className="text-red-500">*</span>
        </label>
        <input
          id="streetLine1"
          type="text"
          value={streetLine1}
          onChange={(e) => setStreetLine1(e.target.value)}
          placeholder="123 Main Street"
          required
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="streetLine2" className="block text-xs font-medium text-gray-700 mb-1">
          Street Address (Continued)
        </label>
        <input
          id="streetLine2"
          type="text"
          value={streetLine2}
          onChange={(e) => setStreetLine2(e.target.value)}
          placeholder="Apartment, suite, etc. (optional)"
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city" className="block text-xs font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Kingston"
            required
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-xs font-medium text-gray-700 mb-1">
            Parish <span className="text-red-500">*</span>
          </label>
          <input
            id="state"
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="Kingston"
            required
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="postalCode" className="block text-xs font-medium text-gray-700 mb-1">
            Postal Code <span className="text-red-500">*</span>
          </label>
          <input
            id="postalCode"
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="12345"
            required
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-xs font-medium text-gray-700 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Jamaica">Jamaica</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="dateOfBirth" className="block text-xs font-medium text-gray-700 mb-1">
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <input
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
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
