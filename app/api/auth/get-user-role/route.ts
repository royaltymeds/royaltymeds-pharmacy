import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/get-user-role
 * Get a user's role by ID using service role client
 * Used by client-side login form which can't bypass RLS
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS on users table
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error } = await serviceRoleClient
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[get-user-role API] Error fetching user role:", error);
      return NextResponse.json(
        { error: "Could not fetch user role", role: "patient" },
        { status: 200 } // Return 200 with default role to allow login to proceed
      );
    }

    return NextResponse.json({
      role: (userData as any)?.role || "patient",
    });
  } catch (error: any) {
    console.error("[get-user-role API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred", role: "patient" },
      { status: 200 } // Return 200 with default role to allow login to proceed
    );
  }
}
