import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
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

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get total prescriptions
    const { count: totalPrescriptions } = await supabase
      .from("doctor_prescriptions")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", user.id);

    // Get pending prescriptions
    const { count: pendingApproval } = await supabase
      .from("doctor_prescriptions")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", user.id)
      .eq("status", "pending");

    // Get approved prescriptions
    const { count: approved } = await supabase
      .from("doctor_prescriptions")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", user.id)
      .eq("status", "approved");

    // Get rejected prescriptions
    const { count: rejected } = await supabase
      .from("doctor_prescriptions")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", user.id)
      .eq("status", "rejected");

    // Get total unique patients
    const { data: prescriptions } = await supabase
      .from("doctor_prescriptions")
      .select("patient_id")
      .eq("doctor_id", user.id);

    const uniquePatients = new Set(
      (prescriptions || []).map((p: any) => p.patient_id)
    );

    return NextResponse.json({
      totalPrescriptions: totalPrescriptions || 0,
      pendingApproval: pendingApproval || 0,
      approved: approved || 0,
      rejected: rejected || 0,
      totalPatients: uniquePatients.size,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
