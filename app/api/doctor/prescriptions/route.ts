import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

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
        medication_name,
        dosage,
        quantity,
        frequency,
        duration,
        instructions,
        notes,
        status,
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
      medicationName: prescription.medication_name,
      dosage: prescription.dosage,
      quantity: prescription.quantity,
      frequency: prescription.frequency,
      duration: prescription.duration,
      instructions: prescription.instructions,
      notes: prescription.notes,
      status: prescription.status,
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

    // Create medication text representation from medications array
    const medicationsText = body.medications
      ?.map(
        (med: any) =>
          `${med.name} (${med.dosage}, ${med.quantity}, ${med.frequency})`
      )
      .join("; ") || "No medications";

    // Get first medication's quantity and frequency for the single record
    const firstMed = body.medications?.[0];

    const { data: prescriptionData, error } = await supabase
      .from("doctor_prescriptions")
      .insert([
        {
          doctor_id: user.id,
          prescription_number: prescriptionNumber,
          patient_id: patientId,
          medication_name: medicationsText,
          quantity: firstMed?.quantity || null,
          frequency: firstMed?.frequency || null,
          duration: body.duration || null,
          instructions: body.instructions || null,
          notes: body.notes || null,
          file_url: body.file_url || null,
          file_name: body.file_name || null,
          status: "pending",
        },
      ])
      .select();

    if (error) throw error;

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
