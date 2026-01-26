import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/doctor/search-patients?search=... - Search for patients to link
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    // Verify user is authenticated and is a doctor
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if current user is a doctor
    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can search patients" },
        { status: 403 }
      );
    }

    // Get search query from URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    if (!search || search.length < 2) {
      return NextResponse.json([]);
    }

    // Search for patients by email or name (excluding already linked patients)
    const { data: patients, error: searchError } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        user_profiles(
          full_name,
          phone
        )
      `
      )
      .eq("role", "patient")
      .or(`email.ilike.%${search}%,user_profiles.full_name.ilike.%${search}%`)
      .limit(10);

    if (searchError) {
      console.error("[search-patients API] Error searching:", searchError);
      return NextResponse.json(
        { error: searchError.message },
        { status: 500 }
      );
    }

    // Filter out already linked patients
    const { data: linkedIds } = await supabase
      .from("doctor_patient_links")
      .select("patient_id")
      .eq("doctor_id", user.id);

    const linkedPatientIds = (linkedIds || []).map((link: any) => link.patient_id);

    const filteredPatients = (patients || [])
      .filter((p: any) => !linkedPatientIds.includes(p.id))
      .map((p: any) => ({
        id: p.id,
        email: p.email,
        fullName: p.user_profiles?.[0]?.full_name || "Unknown",
        phone: p.user_profiles?.[0]?.phone || "N/A",
      }));

    return NextResponse.json(filteredPatients);
  } catch (error: any) {
    console.error("[search-patients API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
