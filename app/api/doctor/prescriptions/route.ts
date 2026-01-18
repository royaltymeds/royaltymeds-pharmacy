import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { generatePrescriptionNumber } from "@/lib/prescription-number";

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

    // For now, we'll create one prescription record per set of medications
    // In the future, this might be refactored to store medications separately
    const medicationsText = body.medications
      ?.map(
        (med: any) =>
          `${med.name} (${med.dosage}, ${med.quantity}, ${med.frequency})`
      )
      .join("; ");

    // Generate prescription number based on current date/time
    const prescriptionNumber = generatePrescriptionNumber();

    const { error } = await supabase.from("doctor_prescriptions").insert([
      {
        doctor_id: user.id,
        prescription_number: prescriptionNumber,
        patient_id: body.patientId,
        medication_name: medicationsText || "No medications",
        dosage: body.medications?.[0]?.dosage || null,
        quantity: body.medications?.[0]?.quantity || null,
        frequency: body.medications?.[0]?.frequency || null,
        duration: body.duration,
        instructions: body.instructions || null,
        notes: body.notes || null,
        file_url: body.file_url || null,
        status: "pending",
      },
    ]);

    if (error) throw error;

    return NextResponse.json(
      { message: "Prescription submitted successfully" },
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
