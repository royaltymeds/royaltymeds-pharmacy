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
          setData({ error: "Not authenticated" });
          setLoading(false);
          return;
        }

        // Try to fetch as authenticated user
        const { data: myPrescriptions, error: myError } = await supabase
          .from("doctor_prescriptions")
          .select("*")
          .eq("doctor_id", user.id);

        console.log("[Client Debug] My prescriptions query:", {
          count: myPrescriptions?.length,
          error: myError,
          data: myPrescriptions,
        });

        // Try without filter to see if table is accessible
        const { data: allPrescriptions, error: allError } = await supabase
          .from("doctor_prescriptions")
          .select("*")
          .limit(5);

        console.log("[Client Debug] All prescriptions (no filter):", {
          count: allPrescriptions?.length,
          error: allError,
          data: allPrescriptions,
        });

        setData({
          user,
          myPrescriptions: { count: myPrescriptions?.length, data: myPrescriptions, error: myError?.message },
          allPrescriptions: { count: allPrescriptions?.length, data: allPrescriptions, error: allError?.message },
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
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
