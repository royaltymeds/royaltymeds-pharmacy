"use client";

import { useState } from "react";
import { Eye, Trash2, AlertCircle } from "lucide-react";

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

interface MyPrescriptionsClientProps {
  initialPrescriptions: Prescription[];
}

export default function MyPrescriptionsClient({
  initialPrescriptions,
}: MyPrescriptionsClientProps) {
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [filterStatus, setFilterStatus] = useState("all");

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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (prescriptionId: string) => {
    if (!confirm("Are you sure you want to delete this prescription?")) return;

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
          {["all", "pending", "approved", "rejected"].map((status) => (
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
          ))}
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
              className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {prescription.medication_name}
                    </h3>
                    <span
                      className={`w-fit px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        prescription.status
                      )}`}
                    >
                      {prescription.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    Patient ID: {prescription.patient_id}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500">Dosage</p>
                      <p className="font-medium text-gray-900">
                        {prescription.dosage}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p className="font-medium text-gray-900">
                        {prescription.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Frequency</p>
                      <p className="font-medium text-gray-900">
                        {prescription.frequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-medium text-gray-900">
                        {prescription.duration}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(prescription.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
