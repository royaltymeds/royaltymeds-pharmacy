"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader } from "lucide-react";
import MyPrescriptionsClient from "./MyPrescriptionsClient";

interface Prescription {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  quantity: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        const response = await fetch("/api/doctor/prescriptions");

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized - please log in again");
          }
          throw new Error("Failed to fetch prescriptions");
        }

        const data = await response.json();
        setPrescriptions(data);
      } catch (err) {
        console.error("Error loading prescriptions:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    loadPrescriptions();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/doctor/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-blue-600">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">My Prescriptions</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          Track and manage all prescriptions submitted to the pharmacy
        </p>
      </div>

      <MyPrescriptionsClient initialPrescriptions={prescriptions} />
    </div>
  );
}
