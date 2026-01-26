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

    // Create auth user (triggers automatic user and user_profile creation)
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      // Check for duplicate email
      if (createError.message?.includes("duplicate") || createError.message?.includes("already exists")) {
        return NextResponse.json(
          { error: "A doctor with this email already exists" },
          { status: 400 }
        );
      }
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

    // Update user role to doctor (trigger already created the user record)
    const { error: roleError } = await adminClient
      .from("users")
      .update({ role: "doctor", is_active: true })
      .eq("id", doctorId);

    if (roleError) {
      await adminClient.auth.admin.deleteUser(doctorId);
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    // Create user profile with doctor details (Supabase trigger doesn't create profile, only user record)
    const { error: profileError } = await adminClient
      .from("user_profiles")
      .insert({
        user_id: doctorId,
        full_name: fullName,
        specialty: specialization || null,
        address: addressOfPractice,
        phone: contactNumber,
      });

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to update doctor profile" },
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
