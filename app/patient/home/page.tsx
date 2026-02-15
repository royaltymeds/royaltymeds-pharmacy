import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UploadIcon, ShoppingCartIcon, MessageSquareIcon } from "lucide-react";

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
      .limit(5);

    // Fetch pending prescriptions
    const { data: pendingPrescriptionsData } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Fetch recent orders
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("patient_id", userId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Orders fetch error:", ordersError);
    }

    // Fetch pending refill requests
    const { data: refillsData } = await supabase
      .from("refills")
      .select("*")
      .eq("patient_id", userId)
      .eq("status", "pending")
      .limit(3);

    console.log("Dashboard data fetched:", {
      userId,
      prescriptions: prescriptionsData?.length || 0,
      pendingPrescriptions: pendingPrescriptionsData?.length || 0,
      orders: ordersData?.length || 0,
      refills: refillsData?.length || 0,
    });

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
  const recentPrescriptions = prescriptions.slice(0, 5);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-l-4 border-green-600">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
              Welcome, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">
              Manage your prescriptions and orders
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/"
              className="text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm whitespace-nowrap"
            >
              ← Home
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Orders</p>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 sm:mt-3">{orders.length}</p>
              <div className="mt-3 sm:mt-4 space-y-2">
                {(() => {
                  const statusCounts: Record<string, number> = {};
                  orders.forEach(order => {
                    statusCounts[order.status || 'unknown'] = (statusCounts[order.status || 'unknown'] || 0) + 1;
                  });
                  return Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-xs sm:text-sm text-gray-600">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <ShoppingCartIcon className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 flex-shrink-0 opacity-50" />
          </div>
        </div>

        {/* Total Prescriptions */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Prescriptions</p>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 sm:mt-3">{prescriptions.length + pendingPrescriptions.length}</p>
              <div className="mt-3 sm:mt-4 space-y-2">
                {(() => {
                  const statusCounts: Record<string, number> = {};
                  [...prescriptions, ...pendingPrescriptions].forEach(prescription => {
                    statusCounts[prescription.status || 'unknown'] = (statusCounts[prescription.status || 'unknown'] || 0) + 1;
                  });
                  return Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-xs sm:text-sm text-gray-600">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <UploadIcon className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 flex-shrink-0 opacity-50" />
          </div>
        </div>

        {/* Unread Messages */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Unread Messages</p>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 sm:mt-3">0</p>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">No unread messages</p>
              <Link href="/patient/messages" className="mt-2 inline-block text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm">
                View Messages →
              </Link>
            </div>
            <MessageSquareIcon className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 flex-shrink-0 opacity-50" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Link
            href="/patient/prescriptions"
            className="bg-green-50 text-green-600 hover:bg-green-100 rounded-lg p-2 sm:p-3 md:p-4 text-center text-xs sm:text-sm md:text-base font-medium transition cursor-pointer"
          >
            Upload Prescription
          </Link>

          <Link
            href="/patient/orders"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg p-2 sm:p-3 md:p-4 text-center text-xs sm:text-sm md:text-base font-medium transition cursor-pointer"
          >
            View Orders
          </Link>

          <Link
            href="/patient/prescriptions"
            className="bg-green-50 text-green-600 hover:bg-green-100 rounded-lg p-2 sm:p-3 md:p-4 text-center text-xs sm:text-sm md:text-base font-medium transition cursor-pointer"
          >
            Request Refill
          </Link>

          <Link
            href="/patient/messages"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg p-2 sm:p-3 md:p-4 text-center text-xs sm:text-sm md:text-base font-medium transition cursor-pointer"
          >
            Messages
          </Link>
        </div>
      </div>

      {/* Recent Prescriptions & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
            Recent Prescriptions
          </h2>
          {recentPrescriptions.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentPrescriptions
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((prescription) => (
                <div
                  key={prescription.id}
                  className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {prescription.medication_name || "Prescription"}
                      </p>
                      <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded">
                        #{prescription.prescription_number}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
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
            <p className="text-gray-600 text-center py-6 sm:py-8 text-sm">
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
            className="block mt-3 sm:mt-4 text-center text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm"
          >
            View All →
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Recent Orders</h2>
          {orders.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {orders
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
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
            <p className="text-gray-600 text-center py-6 sm:py-8 text-sm">
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
            className="block mt-3 sm:mt-4 text-center text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm"
          >
            View All →
          </Link>
        </div>
      </div>
    </div>
  );
}
