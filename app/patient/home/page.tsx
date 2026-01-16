import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PatientDashboardClient from "./PatientDashboardClient";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch active/approved prescriptions
  const { data: prescriptionsData } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patient_id", user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch pending prescriptions
  const { data: pendingPrescriptionsData } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patient_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Fetch recent orders
  const { data: ordersData } = await supabase
    .from("orders")
    .select("*")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch pending refill requests
  const { data: refillsData } = await supabase
    .from("refills")
    .select("*")
    .eq("patient_id", user.id)
    .eq("status", "pending")
    .limit(3);

  return {
    user,
    profile: profileData,
    prescriptions: prescriptionsData || [],
    pendingPrescriptions: pendingPrescriptionsData || [],
    orders: ordersData || [],
    refills: refillsData || [],
  };
}

export default async function PatientHomePage() {
  const dashboardData = await getDashboardData();

  return <PatientDashboardClient initialData={dashboardData} />;
}
