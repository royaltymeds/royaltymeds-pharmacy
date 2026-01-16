import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/dashboard
 * Fetch dashboard statistics for authenticated admin
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Check if user is admin (you may want to add more robust role checking)
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied - admin only" },
        { status: 403 }
      );
    }

    // Fetch all prescriptions with status breakdown
    const { data: allPrescriptions } = await supabase
      .from("prescriptions")
      .select("id, status, medication_name, patient_id, doctor_id, created_at")
      .order("created_at", { ascending: false });

    // Fetch pending prescriptions (for recent list)
    const { data: pendingPrescriptionsData } = await supabase
      .from("prescriptions")
      .select("id, medication_name, patient_id, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch all orders with status breakdown
    const { data: allOrders } = await supabase
      .from("orders")
      .select("id, status, created_at");

    // Fetch all refills
    const { data: allRefills } = await supabase
      .from("refills")
      .select("id, status, created_at")
      .eq("status", "pending");

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
      pending: allRefills?.length || 0,
    };

    return NextResponse.json({
      prescriptionStats,
      orderStats,
      refillStats,
      pendingPrescriptions: pendingPrescriptionsData || [],
    });
  } catch (error) {
    console.error("Admin dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
