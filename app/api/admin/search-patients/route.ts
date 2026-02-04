import { createClient } from "@supabase/supabase-js";
import { createClientForApi } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);
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

    // Create service role client to bypass RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if current user is admin
    const { data: currentUser } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can search patients" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.toLowerCase() || "";

    if (search.length < 2) {
      return NextResponse.json([]);
    }

    // Search for patients by email first
    const { data: patientUsers, error: userError } = await adminClient
      .from("users")
      .select("id, email")
      .eq("role", "patient")
      .or(
        `email.ilike.%${search}%`
      )
      .limit(20);

    if (userError) {
      console.error("[admin/search-patients] Error searching users:", userError);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    if (!patientUsers || patientUsers.length === 0) {
      return NextResponse.json([]);
    }

    const patientIds = patientUsers.map((u: any) => u.id);

    // Get patient profiles to search by name and phone
    const { data: profiles, error: profileError } = await adminClient
      .from("user_profiles")
      .select("user_id, full_name, phone, address, date_of_birth")
      .or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%`
      )
      .limit(20);

    if (profileError) {
      console.error("[admin/search-patients] Error searching profiles:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // Combine results - patients found by email or those with matching profiles
    const profileUserIds = (profiles || []).map((p: any) => p.user_id);
    const allPatientIds = new Set([...patientIds, ...profileUserIds]);

    // Fetch all matching patient details
    const { data: patients, error: finalError } = await adminClient
      .from("users")
      .select("id, email")
      .eq("role", "patient")
      .in("id", Array.from(allPatientIds));

    if (finalError) {
      console.error("[admin/search-patients] Error fetching patient details:", finalError);
      return NextResponse.json({ error: finalError.message }, { status: 400 });
    }

    // Get profiles for all matching patients
    const { data: allProfiles, error: allProfilesError } = await adminClient
      .from("user_profiles")
      .select("user_id, full_name, phone, address, date_of_birth")
      .in("user_id", Array.from(allPatientIds));

    if (allProfilesError) {
      console.error("[admin/search-patients] Error fetching profiles:", allProfilesError);
      return NextResponse.json({ error: allProfilesError.message }, { status: 400 });
    }

    // Build profile map
    const profileMap = new Map();
    (allProfiles || []).forEach((p: any) => {
      profileMap.set(p.user_id, p);
    });

    // Format results
    const results = (patients || []).map((p: any) => {
      const profile = profileMap.get(p.id);
      return {
        id: p.id,
        email: p.email,
        fullName: profile?.full_name || "Unknown",
        phone: profile?.phone || null,
        address: profile?.address || null,
        dateOfBirth: profile?.date_of_birth || null,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[admin/search-patients] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
