import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Get the admin auth token from the request
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify admin user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user: adminUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: adminProfile } = await adminClient
      .from("user_profiles")
      .select("role")
      .eq("user_id", adminUser.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create doctor accounts" },
        { status: 403 }
      );
    }

    // Get request body
    const { email, password, fullName, specialization } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
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
          role: "doctor",
        },
      });

    if (createAuthError) {
      return NextResponse.json(
        { error: createAuthError.message || "Failed to create auth user" },
        { status: 400 }
      );
    }

    const doctorId = authData.user.id;

    // Create user profile
    const { error: profileError } = await adminClient
      .from("user_profiles")
      .insert({
        user_id: doctorId,
        full_name: fullName,
        specialty: specialization || null,
      });

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Doctor account created successfully",
        doctor: {
          id: doctorId,
          email,
          fullName,
          specialization: specialization || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
