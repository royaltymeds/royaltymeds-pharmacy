"use client";

import Link from "next/link";
import { CheckCircle, X, AlertCircle, Download, Edit2, Plus, Trash2, Loader } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface PrescriptionDetailClientProps {
  prescription: any;
}

export default function PrescriptionDetailClient({
  prescription: initialPrescription,
}: PrescriptionDetailClientProps) {
  const [prescription, setPrescription] = useState(initialPrescription);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isEditingMeds, setIsEditingMeds] = useState(false);
  const [newMedication, setNewMedication] = useState({
    medication_name: "",
    dosage: "",
    quantity: "",
    notes: "",
  });
  const [editingItems, setEditingItems] = useState<Record<string, any>>({});
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingDoctorDetails, setIsEditingDoctorDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState(prescription.admin_notes || "");
  const [doctorDetails, setDoctorDetails] = useState({
    doctor_name: prescription.doctor_name || "",
    doctor_phone: prescription.doctor_phone || "",
    doctor_email: prescription.doctor_email || "",
    practice_name: prescription.practice_name || "",
    practice_address: prescription.practice_address || "",
  });
  const [isFillingPrescription, setIsFillingPrescription] = useState(false);
  const [quantitiesBeingFilled, setQuantitiesBeingFilled] = useState<Record<string, number>>({});
  const [prescriptionFileUploaded, setPrescriptionFileUploaded] = useState(false);
  const [prescriptionFilePreview, setPrescriptionFilePreview] = useState<string | null>(null);
  const [prescriptionFileName, setPrescriptionFileName] = useState<string | null>(null);
  const [selectedPrescriptionFile, setSelectedPrescriptionFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fitZoom, setFitZoom] = useState(100);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartY, setPanStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleUpdateStatus = async (newStatus: "approved" | "rejected" | "processing") => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/prescriptions/${prescription.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          table: prescription.source,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || `Failed to ${newStatus} prescription`,
        });
        return;
      }

      // Update local state
      setPrescription({ ...prescription, status: newStatus });
      setMessage({
        type: "success",
        text: `Prescription ${newStatus} successfully`,
      });

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating prescription:", error);
      setMessage({
        type: "error",
        text: "An error occurred while updating the prescription",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/prescriptions/${prescription.id}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newMedication),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to add medication",
        });
        return;
      }

      // Update prescription items
      const updatedItems = [
        ...(prescription.prescription_items || []),
        data,
      ];
      setPrescription({
        ...prescription,
        prescription_items: updatedItems,
      });

      setMessage({
        type: "success",
        text: "Medication added successfully",
      });

      // Reset form
      setNewMedication({
        medication_name: "",
        dosage: "",
        quantity: "",
        notes: "",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error adding medication:", error);
      setMessage({
        type: "error",
        text: "An error occurred while adding the medication",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMedication = async (itemId: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const updatedData = editingItems[itemId];

      const response = await fetch(
        `/api/admin/prescriptions/${prescription.id}/items`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId,
            ...updatedData,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to update medication",
        });
        return;
      }

      // Update prescription items
      const updatedItems = (prescription.prescription_items || []).map(
        (item: any) => (item.id === itemId ? data : item)
      );
      setPrescription({
        ...prescription,
        prescription_items: updatedItems,
      });

      // Clear editing state
      setEditingItems((prev) => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });

      setMessage({
        type: "success",
        text: "Medication updated successfully",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating medication:", error);
      setMessage({
        type: "error",
        text: "An error occurred while updating the medication",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMedication = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this medication?")) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/prescriptions/${prescription.id}/items`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setMessage({
          type: "error",
          text: data.error || "Failed to delete medication",
        });
        return;
      }

      // Update prescription items
      const updatedItems = (prescription.prescription_items || []).filter(
        (item: any) => item.id !== itemId
      );
      setPrescription({
        ...prescription,
        prescription_items: updatedItems,
      });

      setMessage({
        type: "success",
        text: "Medication deleted successfully",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting medication:", error);
      setMessage({
        type: "error",
        text: "An error occurred while deleting the medication",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/prescriptions/${prescription.id}/details`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_notes: adminNotes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to save notes",
        });
        return;
      }

      setPrescription({ ...prescription, admin_notes: adminNotes });
      setIsEditingNotes(false);
      setMessage({
        type: "success",
        text: "Notes saved successfully",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving notes:", error);
      setMessage({
        type: "error",
        text: "An error occurred while saving notes",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDoctorDetails = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/prescriptions/${prescription.id}/details`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(doctorDetails),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to save doctor details",
        });
        return;
      }

      setPrescription({
        ...prescription,
        ...doctorDetails,
      });
      setIsEditingDoctorDetails(false);
      setMessage({
        type: "success",
        text: "Doctor details saved successfully",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving doctor details:", error);
      setMessage({
        type: "error",
        text: "An error occurred while saving doctor details",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillPrescription = () => {
    // Initialize quantities being filled to 0
    const initialQuantities = prescription.prescription_items?.reduce((acc: Record<string, number>, item: any) => ({
      ...acc,
      [item.id]: 0,
    }), {}) || {};
    setQuantitiesBeingFilled(initialQuantities);
    setIsFillingPrescription(true);
  };

  const handleDoneFilling = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate quantities
      for (const [itemId, quantityFilled] of Object.entries(quantitiesBeingFilled)) {
        const item = prescription.prescription_items.find((pi: any) => pi.id === itemId);
        if (!item) continue;

        const filled = parseInt(quantityFilled as any) || 0;
        if (filled < 0) {
          setMessage({
            type: "error",
            text: "Quantity filled cannot be negative",
          });
          setIsLoading(false);
          return;
        }
        if (filled > item.quantity) {
          setMessage({
            type: "error",
            text: `Quantity filled cannot exceed original quantity for ${item.medication_name}`,
          });
          setIsLoading(false);
          return;
        }
      }

      // API call to fill prescription
      const response = await fetch(
        `/api/admin/prescriptions/${prescription.id}/fill`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: prescription.prescription_items.map((item: any) => ({
              itemId: item.id,
              quantityFilled: quantitiesBeingFilled[item.id] || 0,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to fill prescription",
        });
        return;
      }

      // Update prescription with new data
      setPrescription(data.data.prescription);
      setIsFillingPrescription(false);
      setQuantitiesBeingFilled({});

      setMessage({
        type: "success",
        text: `Prescription ${data.data.prescription.status === "filled" ? "filled" : "partially filled"} successfully`,
      });

      // Refresh page after 1.5 seconds to ensure all data is updated
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Error filling prescription:", error);
      setMessage({
        type: "error",
        text: "An error occurred while filling the prescription",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelFilling = () => {
    setIsFillingPrescription(false);
    setQuantitiesBeingFilled({});
    setPrescriptionFileUploaded(false);
    setPrescriptionFilePreview(null);
    setPrescriptionFileName(null);
    setSelectedPrescriptionFile(null);
  };

  const handleQuantityFilledChange = (itemId: string, value: number) => {
    setQuantitiesBeingFilled({
      ...quantitiesBeingFilled,
      [itemId]: value,
    });
  };

  const handlePrescriptionFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the file and create preview
    setSelectedPrescriptionFile(file);
    setPrescriptionFileName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      setPrescriptionFilePreview("pdf");
    }
  };

  const handlePrescriptionFileUpload = async () => {
    if (!selectedPrescriptionFile) return;

    setIsUploadingFile(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedPrescriptionFile);
      formData.append("prescriptionId", prescription.id);

      const response = await fetch(`/api/admin/prescriptions/${prescription.id}/upload-file`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to upload prescription file",
        });
        setPrescriptionFileUploaded(false);
        return;
      }

      setMessage({
        type: "success",
        text: "Prescription file uploaded successfully",
      });

      setPrescriptionFileUploaded(true);
      setSelectedPrescriptionFile(null);
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error uploading prescription file:", error);
      setMessage({
        type: "error",
        text: "An error occurred while uploading the prescription file",
      });
      setPrescriptionFileUploaded(false);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 10, 100));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 10, 25));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 100) {
      setIsPanning(true);
      setPanStartX(e.clientX - panX);
      setPanStartY(e.clientY - panY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 100) {
      setPanX(e.clientX - panStartX);
      setPanY(e.clientY - panStartY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleDownloadFile = async () => {
    if (!prescription.file_url) return;
    try {
      const response = await fetch(prescription.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-${prescription.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      setMessage({
        type: "error",
        text: "Failed to download file",
      });
    }
  };

  useEffect(() => {
    if (fileViewerOpen && imgRef.current && containerRef.current) {
      const calculateFitZoom = () => {
        const img = imgRef.current;
        const container = containerRef.current;
        if (!img || !container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        if (imgWidth === 0 || imgHeight === 0) {
          setFitZoom(100);
          setZoomLevel(100);
          return;
        }

        const scaleX = (containerWidth - 40) / imgWidth; // 40px padding
        const scaleY = (containerHeight - 40) / imgHeight;
        const calculatedZoom = Math.min(scaleX, scaleY) * 100;
        
        // Always fit within 100%, at least 25%
        const zoomToUse = Math.max(Math.min(calculatedZoom, 100), 25);
        setFitZoom(zoomToUse);
        setZoomLevel(zoomToUse);
        setPanX(0);
        setPanY(0);
      };

      const img = imgRef.current;
      if (img.complete) {
        calculateFitZoom();
      } else {
        img.addEventListener("load", calculateFitZoom);
        return () => img.removeEventListener("load", calculateFitZoom);
      }
    }
  }, [fileViewerOpen, prescription.file_url]);

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
      case "partially_filled":
        return "bg-orange-100 text-orange-800";
      case "filled":
        return "bg-green-100 text-green-800";
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
      case "processing":
        return <AlertCircle className="w-5 h-5" />;
      case "partially_filled":
        return <AlertCircle className="w-5 h-5" />;
      case "filled":
        return <CheckCircle className="w-5 h-5" />;
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

          {/* Medications Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  Medications
                </h2>
              </div>
              {(prescription.status === "processing" || prescription.status === "partially_filled") && (
                <button
                  onClick={() => setIsEditingMeds(!isEditingMeds)}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                  {isEditingMeds ? "Done Editing" : "Make Changes"}
                </button>
              )}
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Existing Medications List */}
            {prescription.prescription_items &&
              prescription.prescription_items.length > 0 && (
                <div className="space-y-4 mb-6">
                  {prescription.prescription_items.map((item: any) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      {editingItems[item.id] ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Medication Name
                              </label>
                              <input
                                type="text"
                                value={editingItems[item.id].medication_name}
                                onChange={(e) =>
                                  setEditingItems({
                                    ...editingItems,
                                    [item.id]: {
                                      ...editingItems[item.id],
                                      medication_name: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Dosage
                              </label>
                              <input
                                type="text"
                                value={editingItems[item.id].dosage}
                                onChange={(e) =>
                                  setEditingItems({
                                    ...editingItems,
                                    [item.id]: {
                                      ...editingItems[item.id],
                                      dosage: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="text"
                              value={editingItems[item.id].quantity}
                              onChange={(e) =>
                                setEditingItems({
                                  ...editingItems,
                                  [item.id]: {
                                    ...editingItems[item.id],
                                    quantity: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <input
                              type="text"
                              value={editingItems[item.id].notes || ""}
                              onChange={(e) =>
                                setEditingItems({
                                  ...editingItems,
                                  [item.id]: {
                                    ...editingItems[item.id],
                                    notes: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleUpdateMedication(item.id)}
                              disabled={isLoading}
                              className="inline-block px-3 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() =>
                                setEditingItems((prev) => {
                                  const newState = { ...prev };
                                  delete newState[item.id];
                                  return newState;
                                })
                              }
                              className="inline-block px-3 py-2 text-xs font-medium bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.medication_name}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Dosage: {item.dosage}
                            </p>
                            <p className="text-sm text-gray-600">
                              Total: {item.total_amount || item.quantity} | Filled: {(item.total_amount || item.quantity) - item.quantity} | Remaining: {item.quantity}
                            </p>
                            {item.notes && (
                              <p className="text-sm text-gray-600 mt-2">
                                Notes: {item.notes}
                              </p>
                            )}
                          </div>
                          {isEditingMeds && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setEditingItems({
                                    ...editingItems,
                                    [item.id]: {
                                      medication_name: item.medication_name,
                                      dosage: item.dosage,
                                      quantity: item.quantity,
                                      notes: item.notes,
                                    },
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMedication(item.id)}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            {/* Add New Medication Form */}
            {isEditingMeds && (
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Medication
                </h3>
                <form onSubmit={handleAddMedication} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Medication Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newMedication.medication_name}
                        onChange={(e) =>
                          setNewMedication({
                            ...newMedication,
                            medication_name: e.target.value,
                          })
                        }
                        placeholder="e.g., Amoxicillin"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Dosage <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newMedication.dosage}
                        onChange={(e) =>
                          setNewMedication({
                            ...newMedication,
                            dosage: e.target.value,
                          })
                        }
                        placeholder="e.g., 500mg"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMedication.quantity}
                      onChange={(e) =>
                        setNewMedication({
                          ...newMedication,
                          quantity: e.target.value,
                        })
                      }
                      placeholder="e.g., 30 tablets"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={newMedication.notes}
                      onChange={(e) =>
                        setNewMedication({
                          ...newMedication,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Optional notes"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-block px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition"
                  >
                    {isLoading ? "Adding..." : "Add Medication"}
                  </button>
                </form>
              </div>
            )}

            {/* Empty State */}
            {(!prescription.prescription_items ||
              prescription.prescription_items.length === 0) &&
              !isEditingMeds && (
                <p className="text-sm text-gray-600 text-center py-4">
                  No medications added yet. Click &quot;Make Changes&quot; to add medications.
                </p>
              )}

            {/* Fill Prescription Button and Fill Timestamp */}
            <div className="mt-6 space-y-4">
              {(prescription.status === "processing" || prescription.status === "partially_filled") && !isFillingPrescription && (
                <button
                  onClick={handleFillPrescription}
                  disabled={!prescription.prescription_items || prescription.prescription_items.length === 0 || isEditingMeds}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-lg transition"
                >
                  Fill Prescription
                </button>
              )}
              {(prescription.status === "partially_filled" || prescription.status === "filled") && prescription.filled_at && (
                <p className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{prescription.status === "partially_filled" ? "Partially filled" : "Filled"} at:</span> {new Date(prescription.filled_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* Fill Mode */}
            {isFillingPrescription && (
              <div className="mt-6 bg-purple-50 rounded-lg p-4 sm:p-6 border border-purple-200">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Fill Prescription - Quantity Details
                </h3>
                <div className="space-y-4 mb-6">
                  {prescription.prescription_items?.map((item: any) => {
                    const quantityFilled = quantitiesBeingFilled[item.id] || 0;
                    const remaining = item.quantity - quantityFilled;
                    const isExceeded = quantityFilled > item.quantity;
                    return (
                      <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                              Medication Name
                            </p>
                            <p className="text-gray-900 font-medium mt-1">{item.medication_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                              Dosage
                            </p>
                            <p className="text-gray-900 mt-1">{item.dosage || "N/A"}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                              Original Quantity
                            </p>
                            <p className="text-gray-900 font-bold mt-1">{item.quantity}</p>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 uppercase tracking-wide font-medium mb-2">
                              Quantity to Fill
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={quantityFilled}
                              onChange={(e) => handleQuantityFilledChange(item.id, parseInt(e.target.value) || 0)}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent ${
                                isExceeded
                                  ? "border-red-300 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-purple-500"
                              }`}
                            />
                            {isExceeded && (
                              <p className="text-xs text-red-600 mt-1">
                                Cannot exceed {item.quantity}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                              Remaining After Fill
                            </p>
                            <p className={`font-bold mt-1 ${remaining === 0 ? "text-green-600" : remaining < 0 ? "text-red-600" : "text-orange-600"}`}>
                              {remaining}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Check if any quantity exceeds the limit */}
                {(() => {
                  const hasExceeded = prescription.prescription_items?.some(
                    (item: any) => (quantitiesBeingFilled[item.id] || 0) > item.quantity
                  );
                  return hasExceeded ? (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm">
                      ⚠️ One or more quantities exceed the available amount. Please correct the values before proceeding.
                    </div>
                  ) : null;
                })()}

                {/* Prescription File Upload */}
                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Update Prescription File <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 mb-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg cursor-pointer transition border border-blue-200">
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Choose File</span>
                      <input
                        type="file"
                        onChange={handlePrescriptionFileSelect}
                        disabled={isUploadingFile}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                    <button
                      onClick={handlePrescriptionFileUpload}
                      disabled={!selectedPrescriptionFile || isUploadingFile}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition flex items-center gap-2 w-auto"
                    >
                      {isUploadingFile ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Upload File'
                      )}
                    </button>
                    {prescriptionFileUploaded && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">File uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* File Preview */}
                  {prescriptionFilePreview && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-medium mb-2">
                        Preview
                      </p>
                      {prescriptionFilePreview === "pdf" ? (
                        <div className="flex items-center gap-2 p-3 bg-white rounded border border-gray-200">
                          <Download className="w-6 h-6 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{prescriptionFileName}</p>
                            <p className="text-xs text-gray-600">PDF Document</p>
                          </div>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prescriptionFilePreview}
                          alt="Prescription preview"
                          className="max-w-xs h-auto rounded border border-gray-200"
                        />
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-600">
                    Accepted formats: PDF, JPG, PNG
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleDoneFilling}
                    disabled={isLoading || !prescriptionFileUploaded || prescription.prescription_items?.some(
                      (item: any) => (quantitiesBeingFilled[item.id] || 0) > item.quantity
                    )}
                    className="inline-block px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2 w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Done Filling'
                    )}
                  </button>
                  <button
                    onClick={handleCancelFilling}
                    disabled={isLoading}
                    className="inline-block px-4 py-2 text-sm font-medium bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-900 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Notes Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Admin Notes
              </h2>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-4">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this prescription..."
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isLoading}
                    className="inline-block px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition"
                  >
                    {isLoading ? "Saving..." : "Save Notes"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingNotes(false);
                      setAdminNotes(prescription.admin_notes || "");
                    }}
                    className="inline-block px-4 py-2 text-sm font-medium bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {prescription.admin_notes || "No notes added yet"}
              </p>
            )}
          </div>

          {/* Doctor Details Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Doctor Details
              </h2>
              {!isEditingDoctorDetails && (
                <button
                  onClick={() => setIsEditingDoctorDetails(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            {isEditingDoctorDetails ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Doctor&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={doctorDetails.doctor_name}
                    onChange={(e) =>
                      setDoctorDetails({
                        ...doctorDetails,
                        doctor_name: e.target.value,
                      })
                    }
                    placeholder="e.g., Dr. John Smith"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={doctorDetails.doctor_phone}
                      onChange={(e) =>
                        setDoctorDetails({
                          ...doctorDetails,
                          doctor_phone: e.target.value,
                        })
                      }
                      placeholder="e.g., (555) 123-4567"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={doctorDetails.doctor_email}
                      onChange={(e) =>
                        setDoctorDetails({
                          ...doctorDetails,
                          doctor_email: e.target.value,
                        })
                      }
                      placeholder="e.g., doctor@example.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Practice Name
                  </label>
                  <input
                    type="text"
                    value={doctorDetails.practice_name}
                    onChange={(e) =>
                      setDoctorDetails({
                        ...doctorDetails,
                        practice_name: e.target.value,
                      })
                    }
                    placeholder="e.g., City Medical Center"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Practice Address
                  </label>
                  <textarea
                    value={doctorDetails.practice_address}
                    onChange={(e) =>
                      setDoctorDetails({
                        ...doctorDetails,
                        practice_address: e.target.value,
                      })
                    }
                    placeholder="e.g., 123 Medical Lane, Suite 200, City, State 12345"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveDoctorDetails}
                    disabled={isLoading}
                    className="inline-block px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition"
                  >
                    {isLoading ? "Saving..." : "Save Details"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingDoctorDetails(false);
                      setDoctorDetails({
                        doctor_name: prescription.doctor_name || "",
                        doctor_phone: prescription.doctor_phone || "",
                        doctor_email: prescription.doctor_email || "",
                        practice_name: prescription.practice_name || "",
                        practice_address: prescription.practice_address || "",
                      });
                    }}
                    className="inline-block px-4 py-2 text-sm font-medium bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Name
                  </p>
                  <p className="text-gray-900 font-medium">
                    {prescription.doctor_name || "Not provided"}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Phone
                    </p>
                    <p className="text-gray-900">
                      {prescription.doctor_phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Email
                    </p>
                    <p className="text-gray-900">
                      {prescription.doctor_email || "Not provided"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Practice Name
                  </p>
                  <p className="text-gray-900">
                    {prescription.practice_name || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Practice Address
                  </p>
                  <p className="text-gray-900">
                    {prescription.practice_address || "Not provided"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - File & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Source Badge */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Source</h2>
            <div className="inline-block">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  prescription.status === "partially_filled" || prescription.status === "filled"
                    ? "bg-green-100 text-green-800"
                    : prescription.source === "patient"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {prescription.status === "partially_filled" || prescription.status === "filled"
                  ? "Pharmacist Submitted"
                  : prescription.source === "patient"
                  ? "Patient Upload"
                  : "Doctor Submitted"}
              </span>
            </div>
          </div>

          {/* File */}
          {prescription.file_url && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Prescription File
              </h2>
              
              {/* Thumbnail Preview */}
              <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center" style={{ height: "200px" }}>
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

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFileViewerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  View File
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* File Viewer Modal */}
          {fileViewerOpen && prescription.file_url && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg w-full max-w-6xl h-auto max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Prescription File Viewer</h3>
                  <button
                    onClick={() => {
                      setFileViewerOpen(false);
                      setZoomLevel(100);
                      setPanX(0);
                      setPanY(0);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 p-3 bg-gray-100 border-b border-gray-200">
                  <button
                    onClick={handleZoomOut}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                  >
                    −
                  </button>
                  <span className="text-sm font-medium text-gray-700 w-12 text-center">{zoomLevel}%</span>
                  <button
                    onClick={handleZoomIn}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                  >
                    +
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={handleDownloadFile}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-gray-200 flex items-center justify-center relative">
                  <div
                    ref={containerRef}
                    className="overflow-hidden relative"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ width: "100%", height: "100%", cursor: isPanning ? "grabbing" : zoomLevel > fitZoom ? "grab" : "auto" }}
                  >
                    {prescription.file_url.includes(".pdf") ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-white">
                          <Download className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">PDF files cannot be previewed in the modal</p>
                          <p className="text-sm text-gray-300 mt-2">Use the Download button to view the file</p>
                        </div>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        ref={imgRef}
                        src={prescription.file_url}
                        alt="Prescription full view"
                        style={{
                          transform: `scale(${zoomLevel / 100}) translate(${panX}px, ${panY}px)`,
                          transformOrigin: "center center",
                          transition: isPanning ? "none" : "transform 0.2s",
                          maxWidth: "100%",
                          maxHeight: "100%",
                        }}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>
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

              {message && (
                <div
                  className={`mb-4 p-3 rounded-lg text-sm ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex justify-between gap-4">
                <button
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={isLoading}
                  className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center gap-2 w-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Approve'
                  )}
                </button>
                <button
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={isLoading}
                  className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center gap-2 w-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Reject'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status Confirmation (when not pending) */}
          {prescription.status !== "pending" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h2>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {prescription.status === "approved" && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-medium">
                        This prescription has been approved
                      </span>
                    </>
                  )}
                  {prescription.status === "rejected" && (
                    <>
                      <X className="w-5 h-5 text-red-600" />
                      <span className="text-red-700 font-medium">
                        This prescription has been rejected
                      </span>
                    </>
                  )}
                  {prescription.status === "processing" && (
                    <>
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-700 font-medium">
                        This prescription is being processed
                      </span>
                    </>
                  )}
                  {prescription.status === "partially_filled" && (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <div>
                        <span className="text-orange-700 font-medium block">
                          This prescription is partially filled
                        </span>
                        {prescription.filled_at && prescription.pharmacist_name && (
                          <span className="text-xs text-orange-600 block mt-1">
                            Filled by {prescription.pharmacist_name} at{" "}
                            {new Date(prescription.filled_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  {prescription.status === "filled" && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <span className="text-green-700 font-medium block">
                          This prescription is filled
                        </span>
                        {prescription.filled_at && prescription.pharmacist_name && (
                          <span className="text-xs text-green-600 block mt-1">
                            Filled by {prescription.pharmacist_name} at{" "}
                            {new Date(prescription.filled_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {prescription.status === "approved" && (
                  <button
                    onClick={() => handleUpdateStatus("processing")}
                    disabled={isLoading}
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
                  >
                    {isLoading ? "Processing..." : "Process Prescription"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
