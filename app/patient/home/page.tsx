import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UploadIcon, ShoppingCartIcon, RefreshCwIcon, MessageSquareIcon } from "lucide-react";

export default async function PatientHomePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch (error) {
            console.error("Cookie error:", error);
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Fetch patient profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch recent prescriptions
  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("*, orders(id, status)")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch recent orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*, prescriptions(medication_name)")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch refill requests
  const { data: refills } = await supabase
    .from("refills")
    .select("*, prescriptions(medication_name)")
    .eq("patient_id", user.id)
    .eq("status", "pending")
    .limit(3);

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-l-4 border-green-600">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
              Welcome, {profile?.full_name?.split(" ")[0] || "Customer"}!
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">Manage your prescriptions and orders</p>
          </div>
          <Link href="/" className="flex-shrink-0 text-green-600 hover:text-green-700 font-medium text-xs md:text-sm whitespace-nowrap">
            ← Home
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Prescriptions */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {prescriptions?.length || 0}
              </p>
            </div>
            <UploadIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {orders?.length || 0}
              </p>
            </div>
            <ShoppingCartIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>

        {/* Refills */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Refills</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {refills?.length || 0}
              </p>
            </div>
            <RefreshCwIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Messages</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <MessageSquareIcon className="h-10 w-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/patient/prescriptions"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg p-4 text-center font-medium transition cursor-pointer"
          >
            Upload Prescription
          </Link>

          <Link
            href="/patient/orders"
            className="bg-green-50 text-green-600 hover:bg-green-100 rounded-lg p-4 text-center font-medium transition cursor-pointer"
          >
            View Orders
          </Link>

          <Link
            href="/patient/refills"
            className="bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg p-4 text-center font-medium transition cursor-pointer"
          >
            Request Refill
          </Link>

          <Link
            href="/patient/messages"
            className="bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg p-4 text-center font-medium transition cursor-pointer"
          >
            Messages
          </Link>
        </div>
      </div>

      {/* Recent Prescriptions & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Prescriptions</h2>
          {prescriptions && prescriptions.length > 0 ? (
            <div className="space-y-3">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {prescription.medication_name || "Prescription"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      prescription.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : prescription.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {prescription.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No prescriptions yet.{" "}
              <Link href="/patient/prescriptions" className="text-indigo-600 hover:underline font-medium">
                Upload one
              </Link>
            </p>
          )}
          <Link
            href="/patient/prescriptions"
            className="block mt-4 text-center text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
          {orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ${order.total_amount?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-blue-100 text-blue-800 capitalize">
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No orders yet. Start by{" "}
              <Link href="/patient/prescriptions" className="text-indigo-600 hover:underline font-medium">
                uploading a prescription
              </Link>
              .
            </p>
          )}
          <Link
            href="/patient/orders"
            className="block mt-4 text-center text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>
      </div>
    </div>
  );
}
