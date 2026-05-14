import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";


export const dynamic = "force-dynamic";

interface DashboardStats {
  prescriptionStats: { pending: number; approved: number; rejected: number; processing: number; total: number };
  orderStats: { pending: number; processing: number; delivered: number; total: number };
  refillStats: { pending: number };
  pendingPrescriptions: any[];
}

async function getDashboardData(): Promise<DashboardStats> {
  try {
    // Create an admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all prescriptions from patient prescriptions table
    const { data: patientPrescriptions = [], error: patientError } = await supabaseAdmin
      .from("prescriptions")
      .select("id, status, patient_id, doctor_id, created_at, prescription_number")
      .order("created_at", { ascending: false });

    if (patientError) {
      console.error("Error fetching patient prescriptions:", patientError);
    }

    // Fetch all prescriptions from doctor prescriptions table
    const { data: doctorPrescriptions = [], error: doctorError } = await supabaseAdmin
      .from("doctor_prescriptions")
      .select("id, status, patient_id, doctor_id, created_at, prescription_number")
      .order("created_at", { ascending: false });

    if (doctorError) {
      console.error("Error fetching doctor prescriptions:", doctorError);
    }

    // Combine both prescription sources
    const allPrescriptions = [
      ...(patientPrescriptions || []).map((p: any) => ({ ...p, source: "patient" })),
      ...(doctorPrescriptions || []).map((p: any) => ({ ...p, source: "doctor" })),
    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Fetch pending prescriptions (for recent list) - from both tables
    const pendingFromPatient = ((patientPrescriptions as any[]) || [])
      .filter((p) => p.status === "pending")
      .slice(0, 5)
      .map((p) => ({ ...p, source: "patient" }));

    const pendingFromDoctor = ((doctorPrescriptions as any[]) || [])
      .filter((p) => p.status === "pending")
      .slice(0, 5 - pendingFromPatient.length)
      .map((p) => ({ ...p, source: "doctor" }));

    const pendingPrescriptionsData = [...pendingFromPatient, ...pendingFromDoctor]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Fetch all orders
    const { data: allOrders = [] } = await supabaseAdmin
      .from("orders")
      .select("id, status, created_at");

    // Fetch all refills
    const { data: allRefills = [] } = await supabaseAdmin
      .from("refills")
      .select("id, status, created_at")
      .eq("status", "pending");

    // Calculate stats from combined prescriptions
    const prescriptionStats = {
      pending: (allPrescriptions as any[]).filter((p) => p.status === "pending").length,
      approved: (allPrescriptions as any[]).filter((p) => p.status === "approved").length,
      rejected: (allPrescriptions as any[]).filter((p) => p.status === "rejected").length,
      processing: (allPrescriptions as any[]).filter((p) => p.status === "processing").length,
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
      prescriptionStats: { pending: 0, approved: 0, rejected: 0, processing: 0, total: 0 },
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

  const dashboardData = await getDashboardData();
  const { pendingPrescriptions } = dashboardData;

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

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: '/admin/restock', title: 'Restock Management', description: 'Review requests, supplier schedules, purchase orders, and receiving.' },
          { href: '/admin/prescriptions', title: 'Prescription Review', description: 'Process patient and doctor-submitted prescriptions.' },
          { href: '/admin/orders', title: 'Orders', description: 'Manage OTC and prescription order payment, fulfillment, and delivery.' },
          { href: '/admin/refills', title: 'Refill Requests', description: 'Review and respond to patient refill requests.' },
          { href: '/admin/inventory', title: 'Inventory', description: 'Maintain OTC and prescription catalog availability.' },
          { href: '/admin/more', title: 'More Admin Tools', description: 'Open additional configuration and operational pages.' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow-md">
            <h2 className="text-base font-semibold text-gray-900">{item.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-green-700">Open →</span>
          </Link>
        ))}
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
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm text-gray-900 font-mono">
                        Rx #{prescription.prescription_number}
                      </p>
                      {prescription.medication_name && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {prescription.medication_name}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-gray-600">
                        Status: <span className="font-medium">Pending</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
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

      </div>

    </div>
  );
}
