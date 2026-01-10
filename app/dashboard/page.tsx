import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Dashboard - RoyaltyMeds",
  description: "Your RoyaltyMeds dashboard",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("sb-auth-token");

  if (!authToken) {
    redirect("/login");
  }

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = userData?.role || "patient";
  const fullName = userProfile?.full_name || user.email;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-semibold">{fullName}</span>
              </span>
              <Link
                href="/profile"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Profile
              </Link>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {role === "patient" && (
                <>
                  <Link
                    href="/patient/prescriptions/upload"
                    className="block px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
                  >
                    Upload Prescription
                  </Link>
                  <Link
                    href="/patient/orders"
                    className="block px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
                  >
                    View Orders
                  </Link>
                </>
              )}
              {role === "doctor" && (
                <>
                  <Link
                    href="/doctor/prescriptions/submit"
                    className="block px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
                  >
                    Submit Prescription
                  </Link>
                  <Link
                    href="/doctor/patients"
                    className="block px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
                  >
                    View Patients
                  </Link>
                </>
              )}
              {role === "admin" && (
                <>
                  <Link
                    href="/admin/prescriptions"
                    className="block px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
                  >
                    Review Prescriptions
                  </Link>
                  <Link
                    href="/admin/orders"
                    className="block px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
                  >
                    Manage Orders
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-600">Email</dt>
                <dd className="text-gray-900 font-medium">{user.email}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Role</dt>
                <dd className="text-gray-900 font-medium capitalize">{role}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Member Since</dt>
                <dd className="text-gray-900 font-medium">
                  {new Date(user.created_at || "").toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Resources */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Phase 2 Completion Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Phase 2 Complete!</h2>
          <p className="text-gray-700 mb-4">
            You have successfully completed Phase 2: Authentication & User Management. The
            following features are now available:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">User signup and login</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Email/password authentication</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Session management</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Protected routes</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">User profiles</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">Role-based dashboards</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
