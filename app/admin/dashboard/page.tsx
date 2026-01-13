import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";

export default async function AdminDashboard() {
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

  // Fetch dashboard statistics
  const { data: pendingPrescriptions } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("status", "pending")
    .limit(5);

  const { data: allPrescriptions } = await supabase
    .from("prescriptions")
    .select("status");

  const { data: allOrders } = await supabase
    .from("orders")
    .select("status");

  const { data: pendingRefills } = await supabase
    .from("refills")
    .select("*")
    .eq("status", "pending")
    .limit(5);

  // Calculate statistics
  const prescriptionStats = {
    pending: allPrescriptions?.filter((p: any) => p.status === "pending").length || 0,
    approved: allPrescriptions?.filter((p: any) => p.status === "approved").length || 0,
    rejected: allPrescriptions?.filter((p: any) => p.status === "rejected").length || 0,
    total: allPrescriptions?.length || 0,
  };

  const orderStats = {
    pending: allOrders?.filter((o: any) => o.status === "pending").length || 0,
    processing: allOrders?.filter((o: any) => o.status === "processing").length || 0,
    delivered: allOrders?.filter((o: any) => o.status === "delivered").length || 0,
    total: allOrders?.length || 0,
  };

  const refillStats = {
    pending: pendingRefills?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 border-l-4 border-green-600">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Pharmacy Dashboard</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">Manage prescriptions, orders, and refills</p>
          </div>
          <Link href="/" className="flex-shrink-0 text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm whitespace-nowrap">
            ← Home
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Prescriptions */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-t-4 border-yellow-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-medium">Pending</p>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{prescriptionStats.pending}</p>
            </div>
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-500 flex-shrink-0 hidden sm:block" />
          </div>
          <Link
            href="/admin/prescriptions"
            className="text-green-600 text-xs md:text-sm font-medium mt-2 sm:mt-3 hover:text-green-700 inline-block"
          >
            View all →
          </Link>
        </div>

        {/* Approved Prescriptions */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-t-4 border-green-600">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-medium">Approved</p>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{prescriptionStats.approved}</p>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-600 flex-shrink-0 hidden sm:block" />
          </div>
          <p className="text-gray-600 text-xs mt-2 sm:mt-3">
            {prescriptionStats.total > 0
              ? `${Math.round((prescriptionStats.approved / prescriptionStats.total) * 100)}% of total`
              : "No prescriptions"}
          </p>
        </div>

        {/* Processing Orders */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-t-4 border-blue-600">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-medium">Processing</p>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{orderStats.processing}</p>
            </div>
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-600 flex-shrink-0 hidden sm:block" />
          </div>
          <Link
            href="/admin/orders"
            className="text-green-600 text-xs md:text-sm font-medium mt-2 sm:mt-3 hover:text-green-700 inline-block"
          >
            View all →
          </Link>
        </div>

        {/* Pending Refills */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-t-4 border-orange-500 col-span-2 sm:col-span-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-medium">Refills</p>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{refillStats.pending}</p>
            </div>
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-600 flex-shrink-0 hidden sm:block" />
          </div>
          <Link
            href="/admin/refills"
            className="text-green-600 text-xs md:text-sm font-medium mt-2 sm:mt-3 hover:text-green-700 inline-block"
          >
            View all →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Pending Prescriptions */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Pending Prescriptions</h2>
          {pendingPrescriptions && pendingPrescriptions.length > 0 ? (
            <div className="space-y-3">
              {(pendingPrescriptions as any[]).map((prescription) => (
                <Link
                  key={prescription.id}
                  href={`/admin/prescriptions/${prescription.id}`}
                  className="block p-3 border border-gray-200 rounded hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-xs sm:text-sm text-gray-900">Rx ID: {prescription.id.slice(0, 8)}</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Status: <span className="font-medium">Pending</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-xs sm:text-sm">No pending prescriptions</p>
          )}
          <Link
            href="/admin/prescriptions"
            className="text-green-600 text-xs sm:text-sm font-medium mt-4 hover:text-green-700 inline-block"
          >
            View all pending prescriptions →
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b text-xs sm:text-sm">
              <span className="text-gray-600">Total Prescriptions</span>
              <span className="font-semibold text-gray-900">{prescriptionStats.total}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-xs sm:text-sm">
              <span className="text-gray-600">Total Orders</span>
              <span className="font-semibold text-gray-900">{orderStats.total}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-xs sm:text-sm">
              <span className="text-gray-600">Approval Rate</span>
              <span className="font-semibold text-gray-900">
                {prescriptionStats.total > 0
                  ? `${Math.round((prescriptionStats.approved / prescriptionStats.total) * 100)}%`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 text-xs sm:text-sm">
              <span className="text-gray-600">Rejection Rate</span>
              <span className="font-semibold text-gray-900">
                {prescriptionStats.total > 0
                  ? `${Math.round((prescriptionStats.rejected / prescriptionStats.total) * 100)}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Link
          href="/admin/prescriptions"
          className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-l-4 border-green-600 hover:shadow-lg transition"
        >
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">Manage Prescriptions</h3>
          <p className="text-gray-600 text-xs md:text-sm mb-4">Review and approve patient prescriptions</p>
          <span className="text-green-600 font-medium text-xs md:text-sm">Go to Prescriptions →</span>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-l-4 border-blue-600 hover:shadow-lg transition"
        >
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">Manage Orders</h3>
          <p className="text-gray-600 text-xs md:text-sm mb-4">Update order status and tracking</p>
          <span className="text-blue-600 font-medium text-xs md:text-sm">Go to Orders →</span>
        </Link>

        <Link
          href="/admin/refills"
          className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-l-4 border-green-600 hover:shadow-lg transition col-span-1 sm:col-span-2 lg:col-span-1"
        >
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">Process Refills</h3>
          <p className="text-gray-600 text-xs md:text-sm mb-4">Approve or reject refill requests</p>
          <span className="text-green-600 font-medium text-xs md:text-sm">Go to Refills →</span>
        </Link>
      </div>
    </div>
  );
}
