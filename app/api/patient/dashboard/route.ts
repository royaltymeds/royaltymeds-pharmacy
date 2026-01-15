import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/patient/dashboard
 * Fetch dashboard data for authenticated patient (home page data)
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

    // Fetch user profile
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Fetch recent prescriptions
    const { data: prescriptionsData } = await supabase
      .from("prescriptions")
      .select("*, orders(id, status)")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    // Fetch recent orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*, prescriptions(medication_name)")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    // Fetch pending refill requests
    const { data: refillsData } = await supabase
      .from("refills")
      .select("*, prescriptions(medication_name)")
      .eq("patient_id", user.id)
      .eq("status", "pending")
      .limit(3);

    return NextResponse.json({
      user,
      profile: profileData,
      prescriptions: prescriptionsData || [],
      orders: ordersData || [],
      refills: refillsData || [],
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
