import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    // Create admin client
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if admin already exists
    const { data: existingUser } = await adminClient
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Admin account with this email already exists" },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: authData, error: createAuthError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "admin",
        },
      });

    if (createAuthError) {
      return NextResponse.json(
        { error: createAuthError.message || "Failed to create auth user" },
        { status: 400 }
      );
    }

    const adminId = authData.user.id;

    // console.log(`Auth user created: ${adminId}, trigger should create users record with role: admin`);

    // Create user profile
    const { error: profileError } = await adminClient
      .from("user_profiles")
      .insert({
        user_id: adminId,
        full_name: fullName,
      });

    if (profileError) {
      console.error("Profile insert error:", profileError);
      return NextResponse.json(
        { error: "Failed to create user profile: " + profileError.message },
        { status: 400 }
      );
    }

    // console.log(`Created profile for user ${adminId}`);

    return NextResponse.json(
      {
        success: true,
        message: "Admin account created successfully",
        admin: {
          id: adminId,
          email,
          fullName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
