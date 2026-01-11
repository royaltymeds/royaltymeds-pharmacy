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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {profile?.full_name?.split(" ")[0] || "Patient"}!
              </h1>
              <p className="text-gray-600 mt-1">Manage your prescriptions and orders</p>
            </div>
            <Link
              href="/profile"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link
            href="/patient/prescriptions"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Upload Prescription</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {prescriptions?.length || 0}
                </p>
              </div>
              <UploadIcon className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </Link>

          <Link
            href="/patient/orders"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">My Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {orders?.length || 0}
                </p>
              </div>
              <ShoppingCartIcon className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </Link>

          <Link
            href="/patient/refills"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Refill Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {refills?.length || 0}
                </p>
              </div>
              <RefreshCwIcon className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </Link>

          <Link
            href="/patient/messages"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Messages</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <MessageSquareIcon className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </Link>
        </div>

        {/* Recent Prescriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Prescriptions</h2>
            {prescriptions && prescriptions.length > 0 ? (
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {prescription.medication_name || "Prescription"}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Status:{" "}
                          <span
                            className={`font-medium ${
                              prescription.status === "approved"
                                ? "text-green-600"
                                : prescription.status === "rejected"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                            }`}
                          >
                            {prescription.status}
                          </span>
                        </p>
                      </div>
                      <Link
                        href={`/patient/prescriptions/${prescription.id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                No prescriptions yet.{" "}
                <Link href="/patient/prescriptions" className="text-indigo-600 hover:underline">
                  Upload one now
                </Link>
              </p>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Status:{" "}
                          <span className="font-medium text-blue-600 capitalize">
                            {order.status}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          ${order.total_amount?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <Link
                        href={`/patient/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        Track
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                No orders yet. Start by{" "}
                <Link href="/patient/prescriptions" className="text-indigo-600 hover:underline">
                  uploading a prescription
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
