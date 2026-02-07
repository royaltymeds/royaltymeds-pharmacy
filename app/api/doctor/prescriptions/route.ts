import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let query = supabase
      .from("doctor_prescriptions")
      .select(
        `
        id,
        prescription_number,
        patient_id,
        duration,
        instructions,
        notes,
        status,
        file_url,
        file_name,
        created_at
      `
      )
      .eq("doctor_id", user.id);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("updated_at", {
      ascending: false,
    });

    if (error) throw error;

    const formattedData = data?.map((prescription: any) => ({
      id: prescription.id,
      prescriptionNumber: prescription.prescription_number,
      patientId: prescription.patient_id,
      duration: prescription.duration,
      instructions: prescription.instructions,
      notes: prescription.notes,
      status: prescription.status,
      fileUrl: prescription.file_url,
      fileName: prescription.file_name,
      createdAt: prescription.created_at,
    })) || [];

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate required fields
    const prescriptionNumber = body.prescriptionNumber;

    if (!prescriptionNumber) {
      return NextResponse.json(
        { error: "Missing prescription number" },
        { status: 400 }
      );
    }

    if (!body.file_url) {
      return NextResponse.json(
        { error: "Missing prescription file" },
        { status: 400 }
      );
    }

    // Create service role client to bypass RLS policies
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Fetch doctor details from auth user and user_profiles table
    const { data: doctorData, error: doctorError } = await adminClient
      .from("user_profiles")
      .select("full_name, phone, address, specialty")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("[Doctor Prescription] Doctor data fetch:", {
      userId: user.id,
      doctorData,
      doctorError,
      userEmail: user.email,
    });

    if (doctorError) {
      console.error("Error fetching doctor details:", doctorError);
    }

    // Create doctor prescription record (header) using service role client
    // Note: patient_id will be NULL and set later by admins
    const { data: prescriptionData, error: prescriptionError } = await adminClient
      .from("doctor_prescriptions")
      .insert([
        {
          doctor_id: user.id,
          prescription_number: prescriptionNumber,
          patient_id: null, // Admins will set this later
          duration: null,
          instructions: null,
          notes: body.notes || null,
          file_url: body.file_url || null,
          file_name: body.file_name || null,
          status: "pending",
          doctor_name: doctorData?.full_name || null,
          doctor_email: user.email || null,
          doctor_phone: doctorData?.phone || null,
          practice_name: doctorData?.specialty || null,
          practice_address: doctorData?.address || null,
        },
      ])
      .select();

    if (prescriptionError) throw prescriptionError;

    console.log("[Doctor Prescription] Created prescription with details:", {
      doctorName: doctorData?.full_name || null,
      doctorEmail: user.email || null,
      doctorPhone: doctorData?.phone || null,
      practiceName: doctorData?.specialty || null,
      practiceAddress: doctorData?.address || null,
      note: "Patient linking and medication items will be added by admins",
    });

    return NextResponse.json(
      { 
        message: "Prescription submitted successfully. Admin will link patient and add medication items.",
        prescription: prescriptionData?.[0] || null
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error submitting prescription:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
