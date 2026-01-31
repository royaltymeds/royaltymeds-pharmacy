"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function DebugPrescriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function debug() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        console.log("[Client Debug] Current user:", { id: user?.id, email: user?.email });

        if (!user) {
          setData({ error: "Not authenticated - please log in first" });
          setLoading(false);
          return;
        }

        // Try to fetch as authenticated user
        const { data: myPrescriptions, error: myError } = await supabase
          .from("doctor_prescriptions")
          .select("*")
          .eq("doctor_id", user.id);

        console.log("[Client Debug] My prescriptions query (with doctor_id filter):", {
          userId: user.id,
          count: myPrescriptions?.length,
          error: myError?.message,
          data: myPrescriptions,
        });

        // Try without filter to see if table is accessible at all
        const { data: allPrescriptions, error: allError } = await supabase
          .from("doctor_prescriptions")
          .select("*");

        console.log("[Client Debug] All prescriptions (no filter):", {
          count: allPrescriptions?.length,
          error: allError?.message,
          data: allPrescriptions,
        });

        // Check if this user is in the users table
        const { data: userRecord, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        console.log("[Client Debug] User record in database:", {
          userRecord,
          error: userError?.message,
        });

        setData({
          currentAuth: { id: user.id, email: user.email },
          userRecord: { data: userRecord, error: userError?.message },
          myPrescriptions: { count: myPrescriptions?.length, data: myPrescriptions, error: myError?.message },
          allPrescriptions: { count: allPrescriptions?.length, data: allPrescriptions, error: allError?.message },
          expectedDoctorId: "196f96b2-283d-4e45-8a93-a195347e9a5b (demodoctor@telemed.com)",
          suggestion: user.id === "196f96b2-283d-4e45-8a93-a195347e9a5b" 
            ? "✓ You ARE logged in as the doctor with the prescription!" 
            : "⚠ You are NOT logged in as demodoctor@telemed.com - that's why you don't see prescriptions",
        });
      } catch (error) {
        console.error("[Client Debug] Exception:", error);
        setData({ exception: String(error) });
      } finally {
        setLoading(false);
      }
    }

    debug();
  }, [supabase]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Doctor Prescriptions Debug</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="mb-4 p-4 bg-blue-100 rounded">
            <p className="font-semibold text-lg">Suggestion:</p>
            <p className="text-lg">{data?.suggestion}</p>
          </div>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
