"use client";

import Link from "next/link";
import { CheckCircle, X, AlertCircle, Download } from "lucide-react";

interface PrescriptionDetailClientProps {
  prescription: any;
}

export default function PrescriptionDetailClient({
  prescription,
}: PrescriptionDetailClientProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-5 h-5" />;
      case "approved":
        return <CheckCircle className="w-5 h-5" />;
      case "rejected":
        return <X className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Prescription Details
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            ID: {prescription.id}
          </p>
        </div>
        <Link
          href="/admin/prescriptions"
          className="text-green-600 hover:text-green-700 font-medium text-sm"
        >
          ← Back to Prescriptions
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Prescription Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  prescription.status
                )}`}
              >
                {getStatusIcon(prescription.status)}
                <span>
                  {prescription.status.charAt(0).toUpperCase() +
                    prescription.status.slice(1)}
                </span>
              </div>
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

          {/* Patient Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Patient Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Name
                </p>
                <p className="text-gray-900 font-medium">
                  {prescription.users?.user_profiles?.full_name || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Patient ID
                </p>
                <p className="text-gray-900 font-medium">
                  {prescription.patient_id}
                </p>
              </div>
            </div>
          </div>

          {/* Prescription Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Prescription Details
            </h2>
            <div className="space-y-3">
              {prescription.source === "doctor" && (
                <>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Medication
                    </p>
                    <p className="text-gray-900">
                      {prescription.medication_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Quantity
                    </p>
                    <p className="text-gray-900">
                      {prescription.quantity || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Frequency
                    </p>
                    <p className="text-gray-900">
                      {prescription.frequency || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Duration
                    </p>
                    <p className="text-gray-900">
                      {prescription.duration || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Instructions
                    </p>
                    <p className="text-gray-900">
                      {prescription.instructions || "N/A"}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Notes
                </p>
                <p className="text-gray-900">
                  {prescription.notes || "No additional notes"}
                </p>
              </div>
            </div>
          </div>

          {/* Medication Items (for patient source prescriptions) */}
          {prescription.source === "patient" &&
            prescription.prescription_items &&
            prescription.prescription_items.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Medications
                </h2>
                <div className="space-y-4">
                  {prescription.prescription_items.map(
                    (item: any, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <p className="font-medium text-gray-900">
                          {item.medication_name || "Unknown Medication"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.quantity || 0}x - {item.frequency || "N/A"}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Right Column - File & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Source Badge */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Source</h2>
            <div className="inline-block">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  prescription.source === "patient"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {prescription.source === "patient" ? "Patient Upload" : "Doctor Submitted"}
              </span>
            </div>
          </div>

          {/* File */}
          {prescription.file_url && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Prescription File
              </h2>
              <a
                href={prescription.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                View File
              </a>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Submitted
                </p>
                <p className="text-gray-900">
                  {new Date(prescription.created_at).toLocaleString()}
                </p>
              </div>
              {prescription.updated_at && (
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Last Updated
                  </p>
                  <p className="text-gray-900">
                    {new Date(prescription.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {prescription.status === "pending" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h2>
              <div className="space-y-2 flex flex-col gap-2">
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition w-auto">
                  Approve
                </button>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition w-auto">
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
