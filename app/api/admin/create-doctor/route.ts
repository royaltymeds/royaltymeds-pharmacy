import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Create doctor request body:", body);
    
    const { email, password, fullName, specialization, addressOfPractice, contactNumber } = body;

    if (!email) {
      console.log("Missing email");
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    if (!password) {
      console.log("Missing password");
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }
    if (!fullName) {
      console.log("Missing fullName");
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }
    if (!addressOfPractice) {
      console.log("Missing addressOfPractice");
      return NextResponse.json(
        { error: "Address of practice is required" },
        { status: 400 }
      );
    }
    if (!contactNumber) {
      console.log("Missing contactNumber");
      return NextResponse.json(
        { error: "Contact number is required" },
        { status: 400 }
      );
    }

    console.log("All required fields present, creating doctor...");

    // Create service role client to bypass RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create auth user
    console.log("Creating auth user...");
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Auth creation error:", createError);
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
      console.error("No user ID returned from auth creation");
      return NextResponse.json(
        { error: "Failed to create doctor" },
        { status: 500 }
      );
    }

    const doctorId = authData.user.id;
    console.log("Created auth user with ID:", doctorId);

    // Create user record in public.users
    console.log("Creating user record...");
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
      console.error("User record creation error:", userError);
      // Delete the auth user if we fail to create the user record
      await adminClient.auth.admin.deleteUser(doctorId);
      return NextResponse.json(
        { error: "Failed to create doctor user record" },
        { status: 500 }
      );
    }

    console.log("User record created, creating profile...");


    // Create user profile
    console.log("Inserting profile with data:", { user_id: doctorId, full_name: fullName, specialty: specialization || null, address: addressOfPractice, phone: contactNumber });
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
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        { error: "Failed to create doctor profile" },
        { status: 500 }
      );
    }

    console.log("Doctor account created successfully");
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
