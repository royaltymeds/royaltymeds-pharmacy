import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET /api/doctor/search-patients?search=... - Search for patients to link
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);
    
    // Create service role client to bypass RLS
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    console.log("[search-patients] Search query:", search);

    if (!search || search.length < 2) {
      console.log("[search-patients] Search too short, returning empty");
      return NextResponse.json([]);
    }

    // Search for patients by email or name (excluding already linked patients)
    console.log("[search-patients] Searching with ilike pattern");
    
    // First, search users by email (use service role to bypass RLS)
    let query = serviceRoleClient
      .from("users")
      .select(
        `
        id,
        email,
        user_profiles!inner (
          full_name,
          phone,
          address,
          date_of_birth
        )
      `
      )
      .eq("role", "patient");

    // Add search filter - can search by email or full_name
    const searchTerm = `%${search}%`;
    query = query.or(`email.ilike.${searchTerm},user_profiles.full_name.ilike.${searchTerm}`);
    query = query.limit(10);

    const { data: patients, error: searchError } = await query;

    console.log("[search-patients] Search results:", { patients, error: searchError });

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
        fullName: p.user_profiles?.[0]?.full_name || p.user_profiles?.full_name || "Unknown",
        phone: p.user_profiles?.[0]?.phone || p.user_profiles?.phone || "N/A",
        address: p.user_profiles?.[0]?.address || p.user_profiles?.address || null,
        dateOfBirth: p.user_profiles?.[0]?.date_of_birth || p.user_profiles?.date_of_birth || null,
      }));

    console.log("[search-patients] Filtered results count:", filteredPatients.length);
    return NextResponse.json(filteredPatients);
  } catch (error: any) {
    console.error("[search-patients API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
