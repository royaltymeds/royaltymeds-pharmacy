import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/refills
 * Fetch all refills for admin
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

    // Check if user is admin
    const { data: userData, error: userError2 } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError2 || userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied - admin only" },
        { status: 403 }
      );
    }

    // Fetch all refills with patient and prescription info
    const { data: refills, error: refillsError } = await supabaseAdmin
      .from("refills")
      .select("*, users!patient_id(user_profiles(full_name)), prescriptions(medication_name, dosage)")
      .order("created_at", { ascending: false });

    if (refillsError) {
      console.error("Error fetching refills:", refillsError);
      return NextResponse.json(
        { error: "Error fetching refills", details: refillsError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      refills: refills || [],
    });
  } catch (error) {
    console.error("Admin refills fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
