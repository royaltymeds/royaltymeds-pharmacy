import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("sb-auth-token");

  let session = null;
  if (authToken) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken.value}`,
          },
        },
      }
    );

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      session = { user: data.user };
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">RoyaltyMeds</h1>
          <p className="text-xl text-gray-700 mb-6">
            The modern prescription fulfillment platform
          </p>
          {!session ? (
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                Create Account
              </Link>
            </div>
          ) : (
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
          )}
        </div>

        {/* Phase 2 Status */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-green-600 mb-6">
            ✅ Phase 2 Complete!
          </h2>
          <p className="text-gray-700 mb-6 text-lg">
            Authentication & User Management is complete. Users can now sign up, log in, and
            manage their profiles.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">✓ Authentication</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Email/password signup</li>
                <li>✓ Email/password login</li>
                <li>✓ Session management</li>
                <li>✓ Protected routes</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">✓ User Management</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ User profiles</li>
                <li>✓ Role-based access (patient/doctor/admin)</li>
                <li>✓ Dashboard for each role</li>
                <li>✓ Profile viewing & editing</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-2">✓ Database</h2>
              <p className="text-gray-600">
                Supabase with 12 tables and RLS security
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-2">✓ Frontend</h2>
              <p className="text-gray-600">
                Next.js 15 with TypeScript and React 19
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-2">✓ Styling</h2>
              <p className="text-gray-600">
                Tailwind CSS 4.0 with responsive design
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-2">✓ Authentication</h2>
              <p className="text-gray-600">
                Supabase Auth with JWT and session management
              </p>
            </div>
          </div>

          {!session ? (
            <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Try It Out</h3>
              <p className="text-blue-800 mb-4">
                Create an account or sign in to see the authentication system in action.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded font-medium hover:bg-blue-50 transition"
                >
                  Sign In
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-12 bg-indigo-50 p-6 rounded-lg border border-indigo-200">
            <h2 className="text-2xl font-bold mb-4 text-indigo-900">Next Steps</h2>
            <ol className="list-decimal list-inside space-y-2 text-indigo-900">
              <li>✓ Phase 1: Project Setup & Architecture</li>
              <li>✓ Phase 2: Authentication & User Management</li>
              <li>⏳ Phase 3: Patient Portal (prescriptions, orders)</li>
              <li>⏳ Phase 4: Admin Dashboard (management, analytics)</li>
              <li>⏳ Phase 5: Doctor Interface (prescription submission)</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}
