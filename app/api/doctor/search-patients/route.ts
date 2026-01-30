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

    // Check if current user is a doctor using service role to bypass RLS
    const { data: currentUser } = await serviceRoleClient
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
    console.log("[search-patients] Searching with ilike pattern for:", search);
    
    // First, search by email
    const { data: emailMatches, error: emailError } = await serviceRoleClient
      .from("users")
      .select(
        `
        id,
        email,
        user_profiles (
          full_name,
          phone,
          address,
          date_of_birth
        )
      `
      )
      .eq("role", "patient")
      .ilike("email", `%${search}%`)
      .limit(10);

    console.log("[search-patients] Email search results:", { count: emailMatches?.length, error: emailError });

    // Then, search by full_name in user_profiles
    const { data: nameMatches } = await serviceRoleClient
      .from("users")
      .select(
        `
        id,
        email,
        user_profiles (
          full_name,
          phone,
          address,
          date_of_birth
        )
      `
      )
      .eq("role", "patient");

    // Manual filter for names (since we can't easily do ilike on joined tables in Supabase)
    const filteredByName = (nameMatches || []).filter((user: any) => {
      const fullName = user.user_profiles?.[0]?.full_name || user.user_profiles?.full_name || "";
      return fullName.toLowerCase().includes(search.toLowerCase());
    }).slice(0, 10);

    console.log("[search-patients] Name search results:", { count: filteredByName.length });

    // Merge results, avoiding duplicates
    const allResults = [...(emailMatches || [])];
    const emailIds = new Set(emailMatches?.map((p: any) => p.id) || []);
    for (const user of filteredByName) {
      if (!emailIds.has(user.id)) {
        allResults.push(user);
      }
    }

    // Filter out already linked patients using service role to bypass RLS
    const { data: linkedIds } = await serviceRoleClient
      .from("doctor_patient_links")
      .select("patient_id")
      .eq("doctor_id", user.id);

    const linkedPatientIds = (linkedIds || []).map((link: any) => link.patient_id);

    const filteredPatients = (allResults || [])
      .filter((p: any) => !linkedPatientIds.includes(p.id))
      .map((p: any) => ({
        id: p.id,
        email: p.email,
        fullName: p.user_profiles?.[0]?.full_name || p.user_profiles?.full_name || "Unknown",
        phone: p.user_profiles?.[0]?.phone || p.user_profiles?.phone || "N/A",
        address: p.user_profiles?.[0]?.address || p.user_profiles?.address || null,
        dateOfBirth: p.user_profiles?.[0]?.date_of_birth || p.user_profiles?.date_of_birth || null,
      }));

    console.log("[search-patients] Final filtered results count:", filteredPatients.length);
    return NextResponse.json(filteredPatients);
  } catch (error: any) {
    console.error("[search-patients API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
