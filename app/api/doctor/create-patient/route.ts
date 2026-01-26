import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is a doctor
    const supabase = createClientForApi(request);

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

    // Check if current user is a doctor
    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can create patient accounts" },
        { status: 403 }
      );
    }

    const { email, password, fullName, phone, address, dateOfBirth } = await request.json();

    // Validate required fields
    if (!email || !password || !fullName || !phone || !address || !dateOfBirth) {
      const missingFields = [];
      if (!email) missingFields.push("email");
      if (!password) missingFields.push("password");
      if (!fullName) missingFields.push("fullName");
      if (!phone) missingFields.push("phone");
      if (!address) missingFields.push("address");
      if (!dateOfBirth) missingFields.push("dateOfBirth");

      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Create service role client to create auth user
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
      console.error("[create-patient API] Auth user creation error:", createError);
      return NextResponse.json(
        { error: createError.message || "Failed to create patient" },
        { status: 400 }
      );
    }

    if (!authData.user?.id) {
      return NextResponse.json(
        { error: "Failed to create patient" },
        { status: 500 }
      );
    }

    const patientId = authData.user.id;

    // Update user role to patient (trigger already created the user record)
    const { error: roleError } = await adminClient
      .from("users")
      .update({ role: "patient", is_active: true })
      .eq("id", patientId);

    if (roleError) {
      await adminClient.auth.admin.deleteUser(patientId);
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: profileError } = await adminClient
      .from("user_profiles")
      .insert({
        user_id: patientId,
        full_name: fullName,
        phone,
        address,
        date_of_birth: dateOfBirth,
      });

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to create patient profile" },
        { status: 500 }
      );
    }

    // Automatically link the patient to the doctor
    const { error: linkError } = await adminClient
      .from("doctor_patient_links")
      .insert({
        doctor_id: user.id,
        patient_id: patientId,
      });

    if (linkError) {
      console.warn("[create-patient API] Failed to auto-link patient, but patient was created:", linkError);
      // Don't fail completely if linking fails - patient is already created
    }

    return NextResponse.json(
      {
        success: true,
        message: "Patient account created and linked successfully",
        patient: {
          id: patientId,
          email,
          fullName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[create-patient API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
