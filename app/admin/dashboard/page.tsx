import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

interface DashboardStats {
  prescriptionStats: { pending: number; approved: number; rejected: number; total: number };
  orderStats: { pending: number; processing: number; delivered: number; total: number };
  refillStats: { pending: number };
  pendingPrescriptions: any[];
}

async function getDashboardData(userId: string): Promise<DashboardStats> {
  try {
    // Create an admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is admin
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (!userData || userData?.role !== "admin") {
      throw new Error("Access denied - admin only");
    }

    // Fetch all prescriptions
    const { data: allPrescriptions = [] } = await supabaseAdmin
      .from("prescriptions")
      .select("id, status, medication_name, patient_id, doctor_id, created_at")
      .order("created_at", { ascending: false });

    // Fetch pending prescriptions (for recent list)
    const { data: pendingPrescriptionsData = [] } = await supabaseAdmin
      .from("prescriptions")
      .select("id, prescription_number, medication_name, patient_id, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch all orders
    const { data: allOrders = [] } = await supabaseAdmin
      .from("orders")
      .select("id, status, created_at");

    // Fetch all refills
    const { data: allRefills = [] } = await supabaseAdmin
      .from("refills")
      .select("id, status, created_at")
      .eq("status", "pending");

    // Calculate stats
    const prescriptionStats = {
      pending: ((allPrescriptions || []) as any[]).filter((p) => p.status === "pending").length,
      approved: ((allPrescriptions || []) as any[]).filter((p) => p.status === "approved").length,
      rejected: ((allPrescriptions || []) as any[]).filter((p) => p.status === "rejected").length,
      total: (allPrescriptions || []).length,
    };

    const orderStats = {
      pending: ((allOrders || []) as any[]).filter((o) => o.status === "pending").length,
      processing: ((allOrders || []) as any[]).filter((o) => o.status === "processing").length,
      delivered: ((allOrders || []) as any[]).filter((o) => o.status === "delivered").length,
      total: (allOrders || []).length,
    };

    const refillStats = {
      pending: ((allRefills || []) as any[]).length,
    };

    return {
      prescriptionStats,
      orderStats,
      refillStats,
      pendingPrescriptions: pendingPrescriptionsData || [],
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      prescriptionStats: { pending: 0, approved: 0, rejected: 0, total: 0 },
      orderStats: { pending: 0, processing: 0, delivered: 0, total: 0 },
      refillStats: { pending: 0 },
      pendingPrescriptions: [],
    };
  }
}

export default async function AdminDashboard() {
  // Auth check - page-level enforcement
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dashboardData = await getDashboardData(user.id);
  const { prescriptionStats, orderStats, refillStats, pendingPrescriptions } = dashboardData;

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Page Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-l-4 border-green-600">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Pharmacy Dashboard</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">Manage prescriptions, orders, and refills</p>
          </div>
          <Link href="/" className="flex-shrink-0 text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm whitespace-nowrap">
            ← Home
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {/* Pending Prescriptions */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 border-t-4 border-yellow-500">
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-medium">Pending</p>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{prescriptionStats.pending}</p>
            </div>
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-500 flex-shrink-0" />
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
          <div className="flex flex-col gap-2">
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
                      <p className="font-medium text-xs sm:text-sm text-gray-900">
                        Rx #{prescription.prescription_number}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {prescription.medication_name || "Prescription"}
                      </p>
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
