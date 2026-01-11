import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create an admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log("[signup API] ========== SIGNUP ENDPOINT CALLED ==========");
  
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("[signup API] Request body:", { email, password });
    console.log("[signup API] Service role key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("[signup API] URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    if (!email || !password) {
      console.warn("[signup API] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("[signup API] Creating auth user:", email);
    console.log("[signup API] supabaseAdmin.auth type:", typeof supabaseAdmin.auth);
    console.log("[signup API] supabaseAdmin.auth.admin exists:", !!supabaseAdmin.auth.admin);
    console.log("[signup API] supabaseAdmin.auth.admin.createUser exists:", typeof supabaseAdmin.auth.admin?.createUser);

    // Use admin API to create user directly
    if (!supabaseAdmin.auth.admin) {
      console.error("[signup API] ERROR: supabaseAdmin.auth.admin is not available");
      return NextResponse.json(
        { error: "Admin API not available" },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for development
    });

    console.log("[signup API] FULL response object:", JSON.stringify({ data, error }, null, 2));
    console.log("[signup API] data type:", typeof data);
    console.log("[signup API] data keys:", data ? Object.keys(data) : "null");
    console.log("[signup API] data.user:", data?.user);
    console.log("[signup API] error type:", typeof error);
    console.log("[signup API] error:", error);

    if (error) {
      console.error("[signup API] Error creating user - throwing error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create user" },
        { status: 400 }
      );
    }

    if (!data?.user?.id) {
      console.error("[signup API] No user ID in response data:", data);
      return NextResponse.json(
        { error: "Failed to create user: No user ID returned" },
        { status: 400 }
      );
    }

    console.log("[signup API] Auth user created successfully:", data.user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (error) {
    console.error("[signup API] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
