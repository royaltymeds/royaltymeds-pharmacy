import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import PrescriptionDetailClient from "./prescription-detail-client";

export const dynamic = "force-dynamic";

interface PrescriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getPrescriptionDetail(prescriptionId: string): Promise<any> {
  // console.log("[getPrescriptionDetail] Looking for prescription ID:", prescriptionId);
  
  try {
    // Create an admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try to fetch from patient prescriptions table first
    // console.log("[getPrescriptionDetail] Searching patient prescriptions table for ID:", prescriptionId);
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
        notes,
        prescription_number,
        file_url,
        admin_notes,
        filled_at,
        pharmacist_name,
        doctor_name,
        doctor_phone,
        doctor_email,
        practice_name,
        practice_address,
        refill_count,
        refill_limit,
        refill_status,
        is_refillable,
        last_refilled_at,
        prescription_items(
          id,
          medication_name,
          dosage,
          quantity,
          quantity_filled,
          price,
          total_amount,
          notes
        ),
        users:patient_id(
          id,
          email,
          user_profiles(
            full_name
          )
        )
      `
      )
      .eq("id", prescriptionId)
      .maybeSingle();

    if (patientError) {
      // console.log("[getPrescriptionDetail] Patient query error:", patientError.message);
    }

    if (patientPrescription) {
      // console.log("[getPrescriptionDetail] Found in patient prescriptions:", patientPrescription.id);
      return { ...patientPrescription, source: "patient" };
    }

    // console.log("[getPrescriptionDetail] Not found in patient prescriptions, searching doctor prescriptions...");
    
    // If not found, try doctor prescriptions table
    // Start with a basic query to debug
    const { data: doctorPrescription, error: doctorError } = await supabaseAdmin
      .from("doctor_prescriptions")
      .select("*")
      .eq("id", prescriptionId)
      .maybeSingle();

    if (doctorError) {
      console.error("[getPrescriptionDetail] Doctor query basic error:", doctorError);
      return null;
    }

    if (!doctorPrescription) {
      // console.log("[getPrescriptionDetail] Prescription not found in either table with ID:", prescriptionId);
      return null;
    }

    // console.log("[getPrescriptionDetail] Found doctor prescription, now fetching items:", doctorPrescription.id);

    // Now fetch with related items - use flexible selection to avoid column errors
    const { data: doctorPrescriptionFull, error: doctorErrorFull } = await supabaseAdmin
      .from("doctor_prescriptions")
      .select(
        `
        id,
        status,
        patient_id,
        doctor_id,
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
        refill_count,
        refill_limit,
        refill_status,
        is_refillable,
        last_refilled_at,
        doctor_prescriptions_items(
          id,
          medication_name,
          dosage,
          quantity,
          quantity_filled,
          price,
          total_amount,
          frequency,
          duration,
          notes
        ),
        users:patient_id(
          id,
          email,
          user_profiles(
            full_name
          )
        )
      `
      )
      .eq("id", prescriptionId)
      .maybeSingle();

    if (doctorErrorFull) {
      console.error("[getPrescriptionDetail] Doctor query full error:", doctorErrorFull.message);
      // Try again without the user join if it fails
      // console.log("[getPrescriptionDetail] Retrying without user join...");
      const { data: doctorPrescriptionRetry, error: doctorErrorRetry } = await supabaseAdmin
        .from("doctor_prescriptions")
        .select(
          `
          id,
          status,
          patient_id,
          doctor_id,
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
          refill_count,
          refill_limit,
          refill_status,
          is_refillable,
          last_refilled_at,
          doctor_prescriptions_items(
            id,
            medication_name,
            dosage,
            quantity,
            quantity_filled,
            price,
            frequency,
            duration,
            notes
          )
        `
        )
        .eq("id", prescriptionId)
        .maybeSingle();

      if (doctorErrorRetry) {
        console.error("[getPrescriptionDetail] Doctor query retry error:", doctorErrorRetry.message);
        return {
          ...doctorPrescription,
          prescription_items: [],
          source: "doctor",
        };
      }

      if (doctorPrescriptionRetry) {
        return {
          ...doctorPrescriptionRetry,
          prescription_items: doctorPrescriptionRetry.doctor_prescriptions_items || [],
          source: "doctor",
        };
      }
    }

    if (doctorPrescriptionFull) {
      // console.log("[getPrescriptionDetail] Found in doctor prescriptions:", doctorPrescriptionFull.id);
      // Normalize doctor_prescriptions_items to prescription_items for consistent rendering
      return {
        ...doctorPrescriptionFull,
        prescription_items: doctorPrescriptionFull.doctor_prescriptions_items || [],
        source: "doctor",
      };
    }

    // Not found in either table
    // console.log("[getPrescriptionDetail] Prescription not found in either table with ID:", prescriptionId);
    return null;
  } catch (error) {
    console.error("[getPrescriptionDetail] Catch error fetching prescription:", error);
    return null;
  }
}

export default async function PrescriptionDetailPage({ params }: PrescriptionDetailPageProps) {
  const { id: prescriptionId } = await params;
  const prescription = await getPrescriptionDetail(prescriptionId);

  if (!prescription) {
    notFound();
  }

  // console.log("[PrescriptionDetailPage] Full prescription object:", JSON.stringify(prescription, null, 2));
  // console.log("[PrescriptionDetailPage] prescription_items array:", prescription.prescription_items);
  // console.log("[PrescriptionDetailPage] prescription_items length:", prescription.prescription_items?.length);

  return (
    <PrescriptionDetailClient prescription={prescription} />
  );
}
