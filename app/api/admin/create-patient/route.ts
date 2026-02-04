import { createClient } from "@supabase/supabase-js";
import { createClientForApi } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
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

    // Create service role client to bypass RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if current user is admin
    const { data: currentUser } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create patient accounts" },
        { status: 403 }
      );
    }

    const {
      email,
      password,
      fullName,
      phone,
      address,
      dateOfBirth,
      doctorId,
    } = await request.json();

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "email, password, and fullName are required" },
        { status: 400 }
      );
    }

    if (!doctorId) {
      return NextResponse.json(
        { error: "doctorId is required" },
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
      console.error("[admin create-patient] Auth user creation error:", createError);
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

    // Update user role to patient
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
        phone: phone || null,
        address: address || null,
        date_of_birth: dateOfBirth || null,
      });

    if (profileError) {
      console.error("[admin create-patient] Profile creation error:", profileError);
      await adminClient.auth.admin.deleteUser(patientId);
      return NextResponse.json(
        { error: "Failed to create patient profile" },
        { status: 500 }
      );
    }

    // Link patient to doctor
    const { error: linkError } = await adminClient
      .from("doctor_patient_links")
      .insert({
        doctor_id: doctorId,
        patient_id: patientId,
      });

    if (linkError) {
      console.warn("[admin create-patient] Failed to auto-link patient:", linkError);
      // Don't fail completely if linking fails - patient is already created
    }

    return NextResponse.json(
      {
        link: {
          patientId,
          doctorId,
          patient: {
            id: patientId,
            email,
            fullName,
            phone: phone || null,
            address: address || null,
            dateOfBirth: dateOfBirth || null,
          },
          doctor: {
            id: doctorId,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[admin create-patient] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
