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

    const { data, error } = await query.order("created_at", {
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
    const patientId = body.patientId;

    if (!prescriptionNumber) {
      return NextResponse.json(
        { error: "Missing prescription number" },
        { status: 400 }
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { error: "Missing patient ID" },
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

    // Create doctor prescription record (header) using service role client
    const { data: prescriptionData, error: prescriptionError } = await adminClient
      .from("doctor_prescriptions")
      .insert([
        {
          doctor_id: user.id,
          prescription_number: prescriptionNumber,
          patient_id: patientId,
          quantity: null,
          frequency: null,
          duration: body.duration || null,
          instructions: body.instructions || null,
          notes: body.notes || null,
          file_url: body.file_url || null,
          file_name: body.file_name || null,
          status: "pending",
        },
      ])
      .select();

    if (prescriptionError) throw prescriptionError;

    const prescriptionId = prescriptionData?.[0]?.id;

    if (!prescriptionId) {
      return NextResponse.json(
        { error: "Failed to create prescription record" },
        { status: 500 }
      );
    }

    // Create medication items (details) for each medication
    if (body.medications && body.medications.length > 0) {
      const medicationItems = body.medications.map((med: any) => ({
        prescription_id: prescriptionId,
        medication_name: med.name,
        dosage: med.dosage || null,
        quantity: med.quantity || null,
        notes: med.frequency ? `Frequency: ${med.frequency}` : null,
        brand_choice: "generic",
      }));

      const { error: itemsError } = await adminClient
        .from("prescription_items")
        .insert(medicationItems);

      if (itemsError) {
        // Rollback the prescription creation on error
        await adminClient.from("doctor_prescriptions").delete().eq("id", prescriptionId);
        throw itemsError;
      }
    }

    return NextResponse.json(
      { 
        message: "Prescription submitted successfully",
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
