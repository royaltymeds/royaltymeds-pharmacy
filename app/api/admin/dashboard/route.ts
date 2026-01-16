import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

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

    // Create an admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is admin using the admin client (bypasses RLS)
    const { data: userData, error: userError2 } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError2) {
      console.error("Error fetching user role:", userError2);
      return NextResponse.json(
        { error: "Error fetching user role", details: userError2 },
        { status: 500 }
      );
    }

    if (!userData || userData?.role !== "admin") {
      console.warn("User is not admin:", { userId: user.id, role: userData?.role });
      return NextResponse.json(
        { error: "Access denied - admin only" },
        { status: 403 }
      );
    }

    // Fetch all prescriptions with status breakdown using admin client
    const { data: allPrescriptions, error: prescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .select("id, status, medication_name, patient_id, doctor_id, created_at")
      .order("created_at", { ascending: false });

    if (prescriptionError) {
      console.error("Error fetching prescriptions:", prescriptionError);
      return NextResponse.json(
        { error: "Error fetching prescriptions", details: prescriptionError },
        { status: 500 }
      );
    }

    // Fetch pending prescriptions (for recent list)
    const { data: pendingPrescriptionsData, error: pendingError } = await supabaseAdmin
      .from("prescriptions")
      .select("id, medication_name, patient_id, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    if (pendingError) {
      console.error("Error fetching pending prescriptions:", pendingError);
    }

    // Fetch all orders with status breakdown
    const { data: allOrders, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, status, created_at");

    if (orderError) {
      console.error("Error fetching orders:", orderError);
    }

    // Fetch all refills
    const { data: allRefills, error: refillError } = await supabaseAdmin
      .from("refills")
      .select("id, status, created_at")
      .eq("status", "pending");

    if (refillError) {
      console.error("Error fetching refills:", refillError);
    }

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
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
