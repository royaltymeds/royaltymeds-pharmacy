"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Users } from "lucide-react";

export default function AdminDoctorsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get current user token
      const { data: sessionData } = await (
        await fetch("/api/auth/session", { method: "GET" })
      ).json();

      if (!sessionData?.session?.access_token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch("/api/admin/create-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          specialization,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create doctor account");
        return;
      }

      setSuccess(true);
      setEmail("");
      setPassword("");
      setFullName("");
      setSpecialization("");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-l-4 border-green-600">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <Users className="w-5 sm:w-6 md:w-8 h-5 sm:h-6 md:h-8 text-green-600 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Manage Doctors</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Create and manage doctor accounts</p>
          </div>
        </div>
      </div>

      {/* Create Doctor Form */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Create New Doctor Account</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-green-700">Doctor account created successfully!</p>
          </div>
        )}

        <form onSubmit={handleCreateDoctor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. John Smith"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Specialization (Optional)
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g., Cardiology, Pediatrics"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 sm:py-3 bg-green-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Creating account..." : "Create Doctor Account"}
          </button>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-800">
          <strong>Note:</strong> Doctor accounts can only be created by pharmacists. Once created, doctors can log in with their email and password.
        </p>
      </div>
    </div>
  );
}
