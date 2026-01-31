"use client";

import { useState } from "react";
import { Download, Trash2, AlertCircle, ChevronDown } from "lucide-react";

interface MedicationItem {
  id: string;
  medication_name: string;
  quantity: number;
  frequency: string | null;
  strength: string | null;
  total_amount: number | null;
  filled_at: string | null;
  pharmacist_name: string | null;
  status: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  duration: string;
  instructions: string | null;
  notes: string | null;
  status: string;
  file_url: string | null;
  file_name: string | null;
  prescription_number: string;
  created_at: string;
  pharmacist_name: string | null;
  filled_at: string | null;
}

interface MyPrescriptionsClientProps {
  initialPrescriptions: Prescription[];
}

export default function MyPrescriptionsClient({
  initialPrescriptions,
}: MyPrescriptionsClientProps) {
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [medicationItems, setMedicationItems] = useState<
    Record<string, MedicationItem[]>
  >({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  console.log("[MyPrescriptionsClient] Received prescriptions:", {
    count: prescriptions.length,
    prescriptions: prescriptions,
  });

  const filteredPrescriptions =
    filterStatus === "all"
      ? prescriptions
      : prescriptions.filter((p) => p.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "filled":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleExpand = async (prescriptionId: string) => {
    if (expandedId === prescriptionId) {
      setExpandedId(null);
    } else {
      setExpandedId(prescriptionId);
      // Fetch medication items if not already loaded
      if (!medicationItems[prescriptionId]) {
        await fetchMedicationItems(prescriptionId);
      }
    }
  };

  const fetchMedicationItems = async (prescriptionId: string) => {
    try {
      setLoadingItems((prev) => ({ ...prev, [prescriptionId]: true }));
      const response = await fetch(
        `/api/doctor/prescriptions/${prescriptionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMedicationItems((prev) => ({
          ...prev,
          [prescriptionId]: data.items || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching medication items:", error);
    } finally {
      setLoadingItems((prev) => ({ ...prev, [prescriptionId]: false }));
    }
  };

  const handleDelete = async (prescriptionId: string) => {
    if (!confirm("Are you sure you want to delete this prescription?"))
      return;

    try {
      const response = await fetch(`/api/doctor/prescriptions/${prescriptionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPrescriptions(prescriptions.filter((p) => p.id !== prescriptionId));
      }
    } catch (error) {
      console.error("Error deleting prescription:", error);
    }
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "approved", "rejected", "processing", "filled"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">
            No prescriptions found
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Card Header - Always Visible */}
              <div
                onClick={() => toggleExpand(prescription.id)}
                className="cursor-pointer p-4 sm:p-6 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      Prescription #{prescription.prescription_number}
                    </h3>
                    <span
                      className={`w-fit px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        prescription.status
                      )}`}
                    >
                      {prescription.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    Patient ID: {prescription.patient_id}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Submitted:{" "}
                    {new Date(prescription.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Expand/Collapse Button */}
                <div className="flex gap-2 flex-shrink-0 items-start">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(prescription.id);
                    }}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button
                    className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all ${
                      expandedId === prescription.id ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown className="h-5 w-5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === prescription.id && (
                <div className="border-t border-gray-200 p-4 sm:p-6 space-y-6">
                  {/* File Thumbnail */}
                  {prescription.file_url && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Prescription File
                      </h4>
                      <div
                        className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center"
                        style={{ height: "200px" }}
                      >
                        {prescription.file_url.includes(".pdf") ? (
                          <div className="text-center">
                            <Download className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">PDF Document</p>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prescription.file_url}
                            alt="Prescription preview"
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                      <a
                        href={prescription.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm"
                      >
                        <Download className="w-4 h-4" />
                        View File
                      </a>
                    </div>
                  )}

                  {/* Prescription Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">
                        Duration
                      </p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {prescription.duration}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">
                        Instructions
                      </p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {prescription.instructions || "N/A"}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">
                        Notes
                      </p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {prescription.notes || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Filled Status */}
                  {prescription.filled_at && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm font-medium text-green-900 mb-1">
                        Filled
                      </p>
                      <p className="text-xs sm:text-sm text-green-700">
                        By: {prescription.pharmacist_name || "Unknown"}
                      </p>
                      <p className="text-xs sm:text-sm text-green-700">
                        Date:{" "}
                        {new Date(prescription.filled_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Medication Items */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Medications
                    </h4>
                    {loadingItems[prescription.id] ? (
                      <div className="text-center py-4">
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent"></div>
                      </div>
                    ) : medicationItems[prescription.id]?.length > 0 ? (
                      <div className="space-y-3">
                        {medicationItems[prescription.id].map((item) => (
                          <div
                            key={item.id}
                            className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h5 className="text-sm sm:text-base font-medium text-gray-900">
                                {item.medication_name}
                              </h5>
                              {item.filled_at && (
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                  Filled
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm mb-2">
                              <div>
                                <p className="text-gray-500">Quantity</p>
                                <p className="font-medium text-gray-900">
                                  {item.quantity}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Strength</p>
                                <p className="font-medium text-gray-900">
                                  {item.strength || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Frequency</p>
                                <p className="font-medium text-gray-900">
                                  {item.frequency || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Amount</p>
                                <p className="font-medium text-gray-900">
                                  ${item.total_amount?.toFixed(2) || "0.00"}
                                </p>
                              </div>
                            </div>
                            {item.filled_at && (
                              <div className="bg-white rounded p-2 border border-green-200">
                                <p className="text-xs text-gray-600 mb-1">
                                  Filled on:{" "}
                                  {new Date(item.filled_at).toLocaleDateString()}
                                </p>
                                {item.pharmacist_name && (
                                  <p className="text-xs text-gray-600">
                                    Pharmacist: {item.pharmacist_name}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-600">
                        No medications added yet
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
