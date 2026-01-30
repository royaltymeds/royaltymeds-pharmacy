import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET /api/doctor/patients - Fetch all patients linked to the current doctor
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);
    
    // Create service role client to bypass RLS
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is authenticated and is a doctor
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

    // Check if current user is a doctor using service role to bypass RLS
    const { data: currentUser } = await serviceRoleClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can access this endpoint" },
        { status: 403 }
      );
    }

    // Get all patient IDs linked to this doctor (use service role to bypass RLS)
    const { data: linkedPatientIds, error: linkError } = await serviceRoleClient
      .from("doctor_patient_links")
      .select("patient_id")
      .eq("doctor_id", user.id);

    if (linkError) {
      console.error("[doctor/linked-patients API] Error fetching linked patient IDs:", linkError);
      console.error("[doctor/linked-patients API] User ID:", user.id);
      console.error("[doctor/linked-patients API] Full error details:", {
        message: linkError.message,
        code: linkError.code,
        details: linkError.details,
        hint: linkError.hint,
      });
      return NextResponse.json(
        { error: linkError.message, details: linkError.details },
        { status: 500 }
      );
    }

    if (!linkedPatientIds || linkedPatientIds.length === 0) {
      return NextResponse.json([]);
    }

    // Now fetch user and profile data for each patient (use service role to bypass RLS)
    const patientIds = linkedPatientIds.map((link: any) => link.patient_id);
    
    const { data: patients, error: patientError } = await serviceRoleClient
      .from("users")
      .select(
        `
        id,
        email,
        user_profiles(
          id,
          full_name,
          phone,
          address,
          date_of_birth
        )
      `
      )
      .in("id", patientIds);

    if (patientError) {
      console.error("[doctor/linked-patients API] Error fetching patient details:", patientError);
      console.error("[doctor/linked-patients API] Patient IDs:", patientIds);
      console.error("[doctor/linked-patients API] Full error details:", {
        message: patientError.message,
        code: patientError.code,
        details: patientError.details,
        hint: patientError.hint,
      });
      return NextResponse.json(
        { error: patientError.message, details: patientError.details },
        { status: 500 }
      );
    }

    console.log("[doctor/linked-patients API] Fetched patients:", { count: patients?.length, patientIds });

    // Format the response
    const formattedPatients = (patients || [])
      .map((patientUser: any) => {
        const profile = patientUser?.user_profiles?.[0];
        return {
          id: patientUser?.id,
          email: patientUser?.email,
          fullName: profile?.full_name || "Unknown",
          phone: profile?.phone,
          address: profile?.address,
          dateOfBirth: profile?.date_of_birth,
        };
      })
      .filter((p: any) => p.id);

    console.log("[doctor/linked-patients API] Formatted patients:", formattedPatients);

    return NextResponse.json({ patients: formattedPatients });
  } catch (error: any) {
    console.error("[doctor/patients API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

// POST /api/doctor/patients - Link a patient to the current doctor
export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    // Create service role client to bypass RLS
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is authenticated and is a doctor
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

    // Check if current user is a doctor using service role to bypass RLS
    const { data: currentUser } = await serviceRoleClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can access this endpoint" },
        { status: 403 }
      );
    }

    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    // Verify the patient exists using service role to bypass RLS
    const { data: patientExists } = await serviceRoleClient
      .from("users")
      .select("id")
      .eq("id", patientId)
      .eq("role", "patient")
      .single();

    if (!patientExists) {
      return NextResponse.json(
        { error: "Patient not found or is not a patient role" },
        { status: 404 }
      );
    }

    // Create the link using service role to bypass RLS
    const { error: linkError } = await serviceRoleClient
      .from("doctor_patient_links")
      .insert({
        doctor_id: user.id,
        patient_id: patientId,
      });

    if (linkError) {
      if (linkError.message.includes("duplicate")) {
        return NextResponse.json(
          { error: "This patient is already linked to you" },
          { status: 400 }
        );
      }
      console.error("[doctor/patients API] Error linking patient:", linkError);
      return NextResponse.json(
        { error: linkError.message },
        { status: 500 }
      );
    }

    // Fetch the newly linked patient's full details
    const { data: newPatientUser } = await serviceRoleClient
      .from("users")
      .select(
        `
        id,
        email,
        user_profiles(
          id,
          full_name,
          phone,
          address,
          date_of_birth
        )
      `
      )
      .eq("id", patientId)
      .single();

    const profile = Array.isArray(newPatientUser?.user_profiles)
      ? newPatientUser?.user_profiles?.[0]
      : newPatientUser?.user_profiles;
    const patientData = {
      id: newPatientUser?.id,
      email: newPatientUser?.email,
      fullName: profile?.full_name || "Unknown",
      phone: profile?.phone,
      address: profile?.address,
      dateOfBirth: profile?.date_of_birth,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Patient linked successfully",
        patient: patientData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[doctor/patients API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

// DELETE /api/doctor/patients - Unlink a patient from the current doctor
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    // Create service role client to bypass RLS
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is authenticated and is a doctor
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

    // Check if current user is a doctor using service role to bypass RLS
    const { data: currentUser } = await serviceRoleClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can access this endpoint" },
        { status: 403 }
      );
    }

    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    // Delete the link using service role to bypass RLS
    const { error: linkError } = await serviceRoleClient
      .from("doctor_patient_links")
      .delete()
      .eq("doctor_id", user.id)
      .eq("patient_id", patientId);

    if (linkError) {
      console.error("[doctor/patients API] Error unlinking patient:", linkError);
      return NextResponse.json(
        { error: linkError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Patient unlinked successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[doctor/patients API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
