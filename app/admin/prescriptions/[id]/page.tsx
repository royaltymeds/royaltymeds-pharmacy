import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import PrescriptionDetailClient from "./prescription-detail-client";

export const dynamic = "force-dynamic";

interface PrescriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getPrescriptionDetail(prescriptionId: string): Promise<any> {
  try {
    // Create an admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try to fetch from patient prescriptions table first
    const { data: patientPrescription } = await supabaseAdmin
      .from("prescriptions")
      .select(
        `
        id,
        status,
        patient_id,
        doctor_id,
        created_at,
        updated_at,
        file_url,
        dosage_instructions,
        notes,
        prescription_number,
        prescription_items(
          id,
          medication_name,
          quantity,
          frequency
        ),
        users:patient_id(
          id,
          user_profiles(
            full_name
          )
        )
      `
      )
      .eq("id", prescriptionId)
      .maybeSingle();

    if (patientPrescription) {
      console.log("Found patient prescription:", patientPrescription.id);
      return { ...patientPrescription, source: "patient" };
    }

    // If not found, try doctor prescriptions table
    const { data: doctorPrescription } = await supabaseAdmin
      .from("doctor_prescriptions")
      .select(
        `
        id,
        status,
        patient_id,
        doctor_id,
        medication_name,
        dosage_instructions,
        quantity,
        frequency,
        created_at,
        updated_at,
        file_url,
        notes,
        prescription_number,
        users:patient_id(
          id,
          user_profiles(
            full_name
          )
        )
      `
      )
      .eq("id", prescriptionId)
      .maybeSingle();

    if (doctorPrescription) {
      console.log("Found doctor prescription:", doctorPrescription.id);
      return { ...doctorPrescription, source: "doctor" };
    }

    // Not found in either table
    console.log("Prescription not found with ID:", prescriptionId);
    return null;
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return null;
  }
}

export default async function PrescriptionDetailPage({ params }: PrescriptionDetailPageProps) {
  const { id: prescriptionId } = await params;
  const prescription = await getPrescriptionDetail(prescriptionId);

  if (!prescription) {
    notFound();
  }

  return (
    <PrescriptionDetailClient prescription={prescription} />
  );
}
