import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/patient/refills
 * Fetch refills for authenticated patient
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

    // Fetch patient's refills
    const { data: refills, error } = await supabase
      .from("refills")
      .select(
        `
        id,
        status,
        refill_number,
        requested_at,
        processed_at,
        prescriptions(
          id,
          medication_name,
          dosage,
          quantity,
          refills_allowed
        )
      `
      )
      .eq("patient_id", user.id)
      .order("requested_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ refills });
  } catch (error) {
    console.error("Refills fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
