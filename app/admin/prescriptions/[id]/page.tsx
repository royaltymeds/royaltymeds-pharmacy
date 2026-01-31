import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import PrescriptionDetailClient from "./prescription-detail-client";

export const dynamic = "force-dynamic";

interface PrescriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getPrescriptionDetail(prescriptionId: string): Promise<any> {
  console.log("[getPrescriptionDetail] Looking for prescription ID:", prescriptionId);
  
  try {
    // Create an admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try to fetch from patient prescriptions table first
    console.log("[getPrescriptionDetail] Searching patient prescriptions table for ID:", prescriptionId);
    const { data: patientPrescription, error: patientError } = await supabaseAdmin
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
        quantity,
        notes,
        prescription_number,
        admin_notes,
        doctor_name,
        doctor_phone,
        doctor_email,
        practice_name,
        practice_address,
        filled_at,
        pharmacist_name,
        prescription_items(
          id,
          medication_name,
          dosage,
          quantity,
          quantity_filled,
          total_amount,
          notes
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

    if (patientError) {
      console.log("[getPrescriptionDetail] Patient query error:", patientError);
    }

    if (patientPrescription) {
      console.log("[getPrescriptionDetail] Found in patient prescriptions:", patientPrescription.id);
      return { ...patientPrescription, source: "patient" };
    }

    console.log("[getPrescriptionDetail] Not found in patient prescriptions, searching doctor prescriptions...");
    
    // If not found, try doctor prescriptions table
    const { data: doctorPrescription, error: doctorError } = await supabaseAdmin
      .from("doctor_prescriptions")
      .select(
        `
        id,
        status,
        patient_id,
        doctor_id,
        quantity,
        frequency,
        duration,
        instructions,
        created_at,
        updated_at,
        notes,
        prescription_number,
        file_url,
        file_name,
        admin_notes,
        filled_at,
        pharmacist_name,
        doctor_name,
        doctor_phone,
        doctor_email,
        practice_name,
        practice_address,
        doctor_prescriptions_items(
          id,
          medication_name,
          dosage,
          quantity,
          quantity_filled,
          notes
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

    if (doctorError) {
      console.log("[getPrescriptionDetail] Doctor query error:", doctorError);
    }

    if (doctorPrescription) {
      console.log("[getPrescriptionDetail] Found in doctor prescriptions:", doctorPrescription.id);
      // Normalize doctor_prescriptions_items to prescription_items for consistent rendering
      return {
        ...doctorPrescription,
        prescription_items: doctorPrescription.doctor_prescriptions_items || [],
        source: "doctor",
      };
    }

    // Not found in either table
    console.log("[getPrescriptionDetail] Prescription not found in either table with ID:", prescriptionId);
    return null;
  } catch (error) {
    console.error("[getPrescriptionDetail] Error fetching prescription:", error);
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
