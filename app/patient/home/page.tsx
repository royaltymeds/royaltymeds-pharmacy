import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UploadIcon, ShoppingCartIcon, RefreshCwIcon, MessageSquareIcon } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch user profile
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Fetch active/approved prescriptions
    const { data: prescriptionsData } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3);

    // Fetch pending prescriptions
    const { data: pendingPrescriptionsData } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Fetch recent orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("patient_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    // Fetch pending refill requests
    const { data: refillsData } = await supabase
      .from("refills")
      .select("*")
      .eq("patient_id", userId)
      .eq("status", "pending")
      .limit(3);

    return {
      profile: profileData,
      prescriptions: prescriptionsData || [],
      pendingPrescriptions: pendingPrescriptionsData || [],
      orders: ordersData || [],
      refills: refillsData || [],
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      profile: null,
      prescriptions: [],
      pendingPrescriptions: [],
      orders: [],
      refills: [],
    };
  }
}

export default async function PatientHomePage() {
  // Auth check - page-level enforcement
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { profile, prescriptions, pendingPrescriptions, orders } =
    await getDashboardData(user.id);

  const firstName = profile?.full_name?.split(" ")[0] || "Customer";
  const allPrescriptions = [...prescriptions, ...pendingPrescriptions];

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-l-4 border-green-600">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
              Welcome, {firstName}!
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              Manage your prescriptions and orders
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/"
              className="text-green-600 hover:text-green-700 font-medium text-xs md:text-sm whitespace-nowrap"
            >
              ← Home
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Prescriptions */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-t-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Active</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                {prescriptions.length}
              </p>
            </div>
            <UploadIcon className="h-8 w-8 md:h-10 md:w-10 text-green-600 flex-shrink-0" />
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-t-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Orders</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                {orders.length}
              </p>
            </div>
            <ShoppingCartIcon className="h-8 w-8 md:h-10 md:w-10 text-blue-600 flex-shrink-0" />
          </div>
        </div>

        {/* Pending Prescriptions */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-t-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">
                Pending
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                {pendingPrescriptions.length}
              </p>
            </div>
            <RefreshCwIcon className="h-8 w-8 md:h-10 md:w-10 text-yellow-500 flex-shrink-0" />
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-t-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">
                Messages
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                0
              </p>
            </div>
            <MessageSquareIcon className="h-8 w-8 md:h-10 md:w-10 text-green-600 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Link
            href="/patient/prescriptions"
            className="bg-green-50 text-green-600 hover:bg-green-100 rounded-lg p-3 md:p-4 text-center text-sm md:text-base font-medium transition cursor-pointer"
          >
            Upload Prescription
          </Link>

          <Link
            href="/patient/orders"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg p-3 md:p-4 text-center text-sm md:text-base font-medium transition cursor-pointer"
          >
            View Orders
          </Link>

          <Link
            href="/patient/refills"
            className="bg-green-50 text-green-600 hover:bg-green-100 rounded-lg p-3 md:p-4 text-center text-sm md:text-base font-medium transition cursor-pointer"
          >
            Request Refill
          </Link>

          <Link
            href="/patient/messages"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg p-3 md:p-4 text-center text-sm md:text-base font-medium transition cursor-pointer"
          >
            Messages
          </Link>
        </div>
      </div>

      {/* Recent Prescriptions & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Prescriptions
          </h2>
          {allPrescriptions.length > 0 ? (
            <div className="space-y-3">
              {allPrescriptions.map((prescription) => (
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
              <Link
                href="/patient/prescriptions"
                className="text-green-600 hover:underline font-medium"
              >
                Upload one
              </Link>
            </p>
          )}
          <Link
            href="/patient/prescriptions"
            className="block mt-4 text-center text-green-600 hover:text-green-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No orders yet.{" "}
              <Link
                href="/patient/orders"
                className="text-green-600 hover:underline font-medium"
              >
                View orders
              </Link>
            </p>
          )}
          <Link
            href="/patient/orders"
            className="block mt-4 text-center text-green-600 hover:text-green-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>
      </div>
    </div>
  );
}
