import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// POST /api/auth/verify-admin - Verify if a user is an admin
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is admin
    const { data: userData, error: userError } = await serviceRoleClient
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("[verify-admin API] Error verifying admin:", userError);
      return NextResponse.json(
        { error: "Failed to verify admin status" },
        { status: 500 }
      );
    }

    const isAdmin = (userData as any)?.role === "admin";

    return NextResponse.json({ isAdmin, role: (userData as any)?.role });
  } catch (error: any) {
    console.error("[verify-admin API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
