import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClientForApi } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);
    
    // Create service role client to bypass RLS
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is authenticated and is admin
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

    // Check if current user is admin (use service role to bypass RLS)
    const { data: currentUser } = await serviceRoleClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can view doctors" },
        { status: 403 }
      );
    }

    // Get all doctor users with their profiles (use service role)
    const { data: doctors, error: usersError } = await serviceRoleClient
      .from("users")
      .select("id, email, created_at")
      .eq("role", "doctor")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("[admin/doctors API] Error fetching doctors:", usersError);
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      );
    }

    // Get profiles for all doctors
    const { data: profiles, error: profilesError } = await serviceRoleClient
      .from("user_profiles")
      .select("user_id, full_name, specialty, phone, street_address_line_1, street_address_line_2, city, state, postal_code, country")
      .in("user_id", (doctors || []).map(d => d.id));

    if (profilesError) {
      console.error("[admin/doctors API] Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    // Map profiles by user_id for quick lookup
    const profileMap = (profiles || []).reduce((acc: any, profile: any) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    const formattedDoctors = (doctors || []).map((doctor: any) => {
      const profile = profileMap[doctor.id];
      
      // Format address from structured fields
      const addressParts = [];
      if (profile?.street_address_line_1) addressParts.push(profile.street_address_line_1);
      if (profile?.street_address_line_2) addressParts.push(profile.street_address_line_2);
      if (profile?.city) addressParts.push(profile.city);
      if (profile?.state) addressParts.push(profile.state);
      if (profile?.postal_code) addressParts.push(profile.postal_code);
      if (profile?.country) addressParts.push(profile.country);
      
      const address = addressParts.length > 0 ? addressParts.join(", ") : "N/A";
      
      return {
        id: doctor.id,
        email: doctor.email,
        fullName: profile?.full_name || "Unknown",
        specialty: profile?.specialty || "N/A",
        phone: profile?.phone || "N/A",
        address,
        createdAt: doctor.created_at,
      };
    });

    return NextResponse.json(formattedDoctors);
  } catch (error: any) {
    console.error("[admin/doctors API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
