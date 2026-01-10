import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Profile - RoyaltyMeds",
  description: "Edit your profile",
};

export default async function ProfilePage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-6 md:p-8">
          <div className="space-y-8">
            {/* Profile Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed after signup
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userProfile?.full_name || ""}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {userProfile?.phone || userProfile?.address ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userProfile?.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <p className="text-gray-900">{userProfile.phone}</p>
                    </div>
                  )}
                  {userProfile?.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <p className="text-gray-900">
                        {userProfile.address}
                        {userProfile.city && `, ${userProfile.city}`}
                        {userProfile.state && `, ${userProfile.state}`}
                        {userProfile.zip && ` ${userProfile.zip}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Account Settings */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
              <div className="space-y-4">
                <button className="w-full md:w-auto px-6 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm">
                  Change Password
                </button>
                <button className="w-full md:w-auto px-6 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm ml-0 md:ml-3">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
