import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    // Get authenticated user
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

    // Use service role client to bypass RLS for role lookup
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's role from database
    const { data: userData, error: userError } = await serviceRoleClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("[auth/user-role] Error fetching user role:", userError);
      // Default to patient if there's an error
      return NextResponse.json({
        userId: user.id,
        email: user.email,
        role: "patient",
      });
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      role: (userData as any)?.role || "patient",
    });
  } catch (error: any) {
    console.error("[auth/user-role] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
