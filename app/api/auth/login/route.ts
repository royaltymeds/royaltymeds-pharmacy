import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Use anon key for signing in
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Sign in with Supabase Auth
    const { data, error } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Login failed" },
        { status: 401 }
      );
    }

    if (!data.user?.id) {
      return NextResponse.json(
        { error: "No user returned from auth" },
        { status: 500 }
      );
    }

    // Get role from auth user metadata (set during account creation)
    const role = data.user.user_metadata?.role || "patient";

    // Use service role key to verify role in users table as a backup
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData } = await adminClient
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    // Use database role if available, otherwise use metadata role
    const finalRole = userData?.role || role;

    return NextResponse.json({
      success: true,
      role: finalRole,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
