import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    // Create authenticated client for the current user
    const supabase = createClientForApi(request);

    // Verify current user is admin
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

    // Create admin service client
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if current user is admin using service role to bypass RLS
    const { data: currentUser } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create admin accounts" },
        { status: 403 }
      );
    }

    const { email, password, fullName, phone, address } = await request.json();

    // Log received data for debugging
    console.log("[create-user API] Received fields:", { email, password: "***", fullName, phone, address });

    if (!email || !password || !fullName || !phone || !address) {
      const missingFields = [];
      if (!email) missingFields.push("email");
      if (!password) missingFields.push("password");
      if (!fullName) missingFields.push("fullName");
      if (!phone) missingFields.push("phone");
      if (!address) missingFields.push("address");
      
      console.warn("[create-user API] Missing fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("[create-user API] Auth user creation error:", createError);
      return NextResponse.json(
        { error: createError.message || "Failed to create user" },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Update user role to admin (trigger already created the user record)
    const { error: roleError } = await adminClient
      .from("users")
      .update({ role: "admin", is_active: true })
      .eq("id", userId);

    if (roleError) {
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    // Create user profile (Supabase trigger doesn't create profile, only user record)
    const { error: profileError } = await adminClient
      .from("user_profiles")
      .insert({
        user_id: userId,
        full_name: fullName,
        phone,
        address,
      });

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Admin account created successfully",
        user: {
          id: userId,
          email,
          fullName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
