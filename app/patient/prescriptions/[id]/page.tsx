'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import PrescriptionFileViewer from "./prescription-file-viewer";
import RefillRequestModal from "../components/RefillRequestModal";


interface PrescriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

interface Prescription {
  id: string;
  status: string;
  patient_id: string;
  doctor_id: string;
  created_at: string;
  updated_at: string;
  file_url: string;
  prescription_number: string;
  doctor_name: string;
  doctor_phone: string;
  doctor_email: string;
  practice_name: string;
  practice_address: string;
  filled_at: string;
  pharmacist_name: string;
  is_refillable?: boolean;
  refill_limit?: number;
  refill_count?: number;
  last_refilled_at?: string;
  prescription_items: Array<{
    id: string;
    medication_name: string;
    dosage: string;
    quantity: number;
    total_amount: number;
    notes: string;
  }>;
}

async function getPrescriptionDetail(prescriptionId: string, token: string): Promise<Prescription | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api/patient/prescriptions/${prescriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.prescription;
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return null;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function PrescriptionDetailPage({
  params,
}: PrescriptionDetailPageProps) {
  const router = useRouter();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRefillModal, setShowRefillModal] = useState(false);

  useEffect(() => {
    const loadPrescription = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError("You must be logged in");
          return;
        }

        const { id } = await params;
        const prescription = await getPrescriptionDetail(id, session.access_token);

        if (!prescription) {
          setError("Prescription not found");
          router.push("/patient/prescriptions");
          return;
        }

        setPrescription(prescription);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadPrescription();
  }, [params, router]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Failed to load prescription"}
          </div>
          <Link href="/patient/prescriptions" className="mt-4 text-green-600 hover:text-green-700">
            ← Back to Prescriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Prescription Details
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            ID: {prescription.id}
          </p>
        </div>
        <Link
          href="/patient/prescriptions"
          className="text-green-600 hover:text-green-700 font-medium text-sm"
        >
          ← Back to Prescriptions
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="flex items-center justify-between gap-3">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  prescription.status
                )}`}
              >
                {prescription.status.charAt(0).toUpperCase() +
                  prescription.status.slice(1)}
              </span>
              {prescription.is_refillable && (
                <button
                  onClick={() => setShowRefillModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Request Refill
                </button>
              )}
            </div>
            {prescription.refill_count !== undefined && prescription.refill_limit !== undefined && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Refills Used: {prescription.refill_count} / {prescription.refill_limit}</p>
                {prescription.last_refilled_at && (
                  <p className="mt-1">Last Refilled: {new Date(prescription.last_refilled_at).toLocaleDateString()}</p>
                )}
              </div>
            )}
          </div>

          {/* Prescription Number */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Prescription Number
            </h2>
            <p className="font-mono text-lg font-bold text-green-600">
              {prescription.prescription_number || "N/A"}
            </p>
          </div>

          {/* Medications Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Medications
            </h2>

            {prescription.prescription_items &&
            prescription.prescription_items.length > 0 ? (
              <div className="space-y-4">
                {prescription.prescription_items.map(
                  (item: any) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {item.medication_name}
                          </h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                            Dosage
                          </p>
                          <p className="text-gray-900 mt-1">
                            {item.dosage || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                            Total: {item.total_amount || item.quantity} | Filled: {(item.total_amount || item.quantity) - item.quantity} | Remaining: {item.quantity}
                          </p>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                            Instructions
                          </p>
                          <p className="text-gray-900 mt-1 text-sm">
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">
                No medications added yet
              </p>
            )}
          </div>

          {/* Doctor Details Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Doctor Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Name
                </p>
                <p className="text-gray-900 mt-1">
                  {prescription.doctor_name || "Not provided"}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Phone
                  </p>
                  <p className="text-gray-900 mt-1">
                    {prescription.doctor_phone ? (
                      <a
                        href={`tel:${prescription.doctor_phone}`}
                        className="text-green-600 hover:underline"
                      >
                        {prescription.doctor_phone}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Email
                  </p>
                  <p className="text-gray-900 mt-1">
                    {prescription.doctor_email ? (
                      <a
                        href={`mailto:${prescription.doctor_email}`}
                        className="text-green-600 hover:underline"
                      >
                        {prescription.doctor_email}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Practice Name
                </p>
                <p className="text-gray-900 mt-1">
                  {prescription.practice_name || "Not provided"}
                </p>
              </div>
              {prescription.practice_address && (
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Practice Address
                  </p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                    {prescription.practice_address}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - File & Timeline */}
        <div className="lg:col-span-1 space-y-6">
          {/* File Section */}
          {prescription.file_url && (
            <PrescriptionFileViewer
              fileUrl={prescription.file_url}
              prescriptionId={prescription.id}
              isAdmin={false}
            />
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Submitted
                </p>
                <p className="text-gray-900 mt-1">
                  {new Date(prescription.created_at).toLocaleString()}
                </p>
              </div>
              {prescription.updated_at && (
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Last Updated
                  </p>
                  <p className="text-gray-900 mt-1">
                    {new Date(prescription.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
              {prescription.filled_at && (
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Filled
                  </p>
                  <p className="text-gray-900 mt-1">
                    {new Date(prescription.filled_at).toLocaleString()}
                  </p>
                  {prescription.pharmacist_name && (
                    <p className="text-xs text-gray-600 mt-1">
                      by {prescription.pharmacist_name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRefillModal && (
        <RefillRequestModal
          prescriptionId={prescription.id}
          medicationName={
            prescription.prescription_items?.[0]?.medication_name || "Prescription"
          }
          onClose={() => setShowRefillModal(false)}
          onSuccess={() => {
            setShowRefillModal(false);
            // Reload prescription to show updated refill info
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
