import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Debug] Current user:", { id: user.id, email: user.email });

    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id);

    console.log("[Debug] User in users table:", { userData, userError });

    // Try to fetch doctor_prescriptions with service role to see all data
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: allPrescriptions, error: allError } = await adminClient
      .from("doctor_prescriptions")
      .select("*");

    console.log("[Debug] All doctor_prescriptions (via service role):", {
      count: allPrescriptions?.length,
      data: allPrescriptions,
      error: allError,
    });

    // Try to fetch doctor_prescriptions with regular client (with RLS)
    const { data: myPrescriptions, error: myError } = await supabase
      .from("doctor_prescriptions")
      .select("*")
      .eq("doctor_id", user.id);

    console.log("[Debug] My doctor_prescriptions (with RLS):", {
      count: myPrescriptions?.length,
      data: myPrescriptions,
      error: myError,
    });

    return NextResponse.json({
      currentUser: { id: user.id, email: user.email },
      userInTable: userData,
      userError,
      allPrescriptions: {
        count: allPrescriptions?.length,
        data: allPrescriptions,
        error: allError,
      },
      myPrescriptions: {
        count: myPrescriptions?.length,
        data: myPrescriptions,
        error: myError,
      },
    });
  } catch (error: any) {
    console.error("[Debug] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
