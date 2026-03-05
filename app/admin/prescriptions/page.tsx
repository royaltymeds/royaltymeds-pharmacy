import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import PrescriptionsClient from "./prescriptions-client";

export const dynamic = "force-dynamic";

interface Prescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  doctor_id: string;
  customer_name?: string;
  medication_name: string;
  dosage: string;
  status: string;
  created_at: string;
  source: "patient" | "doctor";
}

async function getPrescriptions(): Promise<Prescription[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Create admin client for unrestricted access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch prescriptions from patient prescriptions table
    const { data: patientPrescriptions = [] } = await supabaseAdmin
      .from("prescriptions")
      .select("*")
      .order("updated_at", { ascending: false });

    // Fetch prescriptions from doctor prescriptions table
    const { data: doctorPrescriptions = [] } = await supabaseAdmin
      .from("doctor_prescriptions")
      .select("*")
      .order("updated_at", { ascending: false });

    // Combine and mark source
    const allPrescriptions = [
      ...(patientPrescriptions || []).map((p: any) => ({ ...p, source: "patient" as const })),
      ...(doctorPrescriptions || []).map((p: any) => ({ ...p, source: "doctor" as const })),
    ].sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    // Extract patient IDs
    const patientIds = [...new Set(allPrescriptions.map(p => p.patient_id))];

    // Fetch customer names from user_profiles
    if (patientIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', patientIds);

      // Create a map of patient_id -> customer_name
      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p.full_name])
      );

      // Attach customer names to prescriptions
      return allPrescriptions.map(rx => ({
        ...rx,
        customer_name: profileMap.get(rx.patient_id) || 'Unknown Customer'
      }));
    }

    return allPrescriptions;
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return [];
  }
}

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminPrescriptions({ searchParams }: Props) {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all prescriptions
  const allPrescriptions = await getPrescriptions();

  // Pagination
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1"));

  return <PrescriptionsClient prescriptions={allPrescriptions} initialPage={currentPage} />;
}
