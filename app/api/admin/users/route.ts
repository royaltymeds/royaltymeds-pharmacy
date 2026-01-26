import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClientForApi } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

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

    // Check if current user is admin
    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can view admin users" },
        { status: 403 }
      );
    }

    // Use service role client to bypass RLS and get all admin users
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all admin users with their profiles
    const { data: admins, error: usersError } = await adminClient
      .from("users")
      .select("id, email, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("[admin/users API] Error fetching users:", usersError);
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      );
    }

    // Get profiles for all admin users
    const { data: profiles, error: profilesError } = await adminClient
      .from("user_profiles")
      .select("user_id, full_name")
      .in("user_id", (admins || []).map(a => a.id));

    if (profilesError) {
      console.error("[admin/users API] Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    // Map profiles by user_id for quick lookup
    const profileMap = (profiles || []).reduce((acc: any, profile: any) => {
      acc[profile.user_id] = profile.full_name;
      return acc;
    }, {});

    const formattedAdmins = (admins || []).map((admin: any) => ({
      id: admin.id,
      email: admin.email,
      fullName: profileMap[admin.id] || "Unknown",
      createdAt: admin.created_at,
    }));

    return NextResponse.json(formattedAdmins);
  } catch (error: any) {
    console.error("[admin/users API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
