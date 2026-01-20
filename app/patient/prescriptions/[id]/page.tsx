import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

interface PrescriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getPrescriptionDetail(prescriptionId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase
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
        prescription_number,
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
          notes
        )
      `
      )
      .eq("id", prescriptionId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
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

export default async function PrescriptionDetailPage({
  params,
}: PrescriptionDetailPageProps) {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get prescription ID
  const { id } = await params;

  // Fetch prescription
  const prescription = await getPrescriptionDetail(id);

  // Verify patient owns this prescription
  if (!prescription || prescription.patient_id !== user.id) {
    redirect("/patient/prescriptions");
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
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  prescription.status
                )}`}
              >
                {prescription.status.charAt(0).toUpperCase() +
                  prescription.status.slice(1)}
              </span>
            </div>
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
                      <div className="grid grid-cols-2 gap-4 text-sm">
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
                            Quantity
                          </p>
                          <p className="text-gray-900 mt-1">
                            {item.quantity || "N/A"}
                          </p>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                            Notes
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Prescription File
              </h2>
              <a
                href={prescription.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition text-sm"
              >
                <Download className="w-4 h-4" />
                View File
              </a>
            </div>
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
    </div>
  );
}
