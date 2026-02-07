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
