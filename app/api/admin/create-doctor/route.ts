import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, specialization, addressOfPractice, contactNumber } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }
    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }
    if (!addressOfPractice) {
      return NextResponse.json(
        { error: "Address of practice is required" },
        { status: 400 }
      );
    }
    if (!contactNumber) {
      return NextResponse.json(
        { error: "Contact number is required" },
        { status: 400 }
      );
    }

    // Create service role client to bypass RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create auth user
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return NextResponse.json(
        { error: createError.message || "Failed to create doctor" },
        { status: 400 }
      );
    }

    if (!authData.user?.id) {
      return NextResponse.json(
        { error: "Failed to create doctor" },
        { status: 500 }
      );
    }

    const doctorId = authData.user.id;

    // Create user record in public.users
    const { error: userError } = await adminClient
      .from("users")
      .insert([
        {
          id: doctorId,
          email,
          role: "doctor",
          is_active: true,
        },
      ]);

    if (userError) {
      // Delete the auth user if we fail to create the user record
      await adminClient.auth.admin.deleteUser(doctorId);
      return NextResponse.json(
        { error: "Failed to create doctor user record" },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: profileError } = await adminClient
      .from("user_profiles")
      .insert([
        {
          user_id: doctorId,
          full_name: fullName,
          specialty: specialization || null,
          address: addressOfPractice,
          phone: contactNumber,
        },
      ]);

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to create doctor profile" },
        { status: 500 }
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
