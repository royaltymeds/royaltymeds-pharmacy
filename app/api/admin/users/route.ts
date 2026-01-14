import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

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

    // Get all admin users
    const { data: admins, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        created_at,
        user_profiles(full_name)
      `
      )
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const formattedAdmins = (admins || []).map((admin: any) => ({
      id: admin.id,
      email: admin.email,
      fullName: admin.user_profiles?.[0]?.full_name || "Unknown",
      createdAt: admin.created_at,
    }));

    return NextResponse.json(formattedAdmins);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
