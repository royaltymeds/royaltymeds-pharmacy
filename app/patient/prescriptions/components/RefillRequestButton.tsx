"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Check, Loader } from "lucide-react";

interface Prescription {
  id: string;
  prescription_number: string;
  medication_name: string;
  status: string;
  file_url?: string;
  source: "patient" | "doctor";
}

interface RefillRequestButtonProps {
  buttonText?: string;
}

export default function RefillRequestButton({ buttonText = "Request Refill" }: RefillRequestButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partiallyFilledPrescriptions, setPartiallyFilledPrescriptions] = useState<Prescription[]>([]);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load partially filled prescriptions when modal opens
  useEffect(() => {
    if (!isModalOpen) return;

    const loadPartiallyFilledPrescriptions = async () => {
      setIsLoadingPrescriptions(true);
      try {
        const response = await fetch("/api/patient/prescriptions/partially-filled", {
          credentials: "include",
        });

        if (!response.ok) {
          setMessage({
            type: "error",
            text: "Failed to load prescriptions",
          });
          return;
        }

        const data = await response.json();
        console.log("[RefillRequestButton] Loaded prescriptions:", data.prescriptions);
        setPartiallyFilledPrescriptions(data.prescriptions || []);
      } catch (error) {
        console.error("Error loading prescriptions:", error);
        setMessage({
          type: "error",
          text: "An error occurred while loading prescriptions",
        });
      } finally {
        setIsLoadingPrescriptions(false);
      }
    };

    loadPartiallyFilledPrescriptions();
  }, [isModalOpen]);

  const handleConfirmRefill = async () => {
    if (!selectedPrescription) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/patient/prescriptions/${selectedPrescription.id}/request-refill`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: selectedPrescription.source,
          }),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to request refill",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Refill requested successfully!",
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedPrescription(null);
        setIsConfirming(false);
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error requesting refill:", error);
      setMessage({
        type: "error",
        text: "An error occurred while requesting refill",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
      >
        {buttonText}
      </button>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Modal */}
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Request Prescription Refill</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPrescription(null);
                  setIsConfirming(false);
                  setMessage(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {message && (
                <div
                  className={`p-4 rounded-lg flex items-start gap-3 ${
                    message.type === "success"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {message.type === "success" ? (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p
                    className={`text-sm ${
                      message.type === "success" ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              )}

              {/* Step 1: Select Prescription */}
              {!selectedPrescription && !isConfirming && (
                <>
                  <div>
                    <p className="text-gray-700 text-sm mb-4">
                      Select a prescription from the list below that you would like to refill:
                    </p>

                    {isLoadingPrescriptions ? (
                      <div className="flex justify-center py-8">
                        <Loader className="w-6 h-6 text-green-600 animate-spin" />
                      </div>
                    ) : partiallyFilledPrescriptions.length > 0 ? (
                      <div className="space-y-3">
                        {partiallyFilledPrescriptions.map((prescription) => (
                          <button
                            key={prescription.id}
                            onClick={() => setSelectedPrescription(prescription)}
                            className="w-full border border-gray-200 rounded-lg p-4 text-left hover:border-green-600 hover:bg-green-50 transition"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {prescription.medication_name || "Prescription"}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Prescription #{prescription.prescription_number}
                                </p>
                              </div>
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">
                                {prescription.status?.charAt(0).toUpperCase() +
                                  prescription.status?.slice(1)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-600">
                        <p className="text-sm">
                          No prescriptions available for refill. You can only request refills for prescriptions in partially filled status.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Show Image & Confirm */}
              {selectedPrescription && !isConfirming && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Selected Prescription:
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="font-medium text-gray-900">
                        {selectedPrescription.medication_name || "Prescription"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Prescription #{selectedPrescription.prescription_number}
                      </p>
                    </div>
                  </div>

                  {selectedPrescription.file_url && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Prescription Image:
                      </p>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center" style={{ maxHeight: "400px" }}>
                        <img
                          src={selectedPrescription.file_url}
                          alt="Prescription"
                          className="max-w-full max-h-[400px] object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Confirm Refill Request
                      </p>
                      <p className="text-sm text-blue-800">
                        Is this the prescription you would like to refill?
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setSelectedPrescription(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                    >
                      No, Choose Another
                    </button>
                    <button
                      onClick={() => setIsConfirming(true)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                    >
                      Yes, Request Refill
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {isConfirming && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900">
                      Refill request for:
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-base font-semibold text-green-900">
                        {selectedPrescription?.medication_name}
                      </p>
                      <p className="text-sm text-green-800">
                        Prescription #{selectedPrescription?.prescription_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsConfirming(false)}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmRefill}
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                      Confirm Refill Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
