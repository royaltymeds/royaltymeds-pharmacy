"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Trash2, AlertCircle, ChevronDown, X } from "lucide-react";

interface MedicationItem {
  id: string;
  medication_name: string;
  quantity: number;
  frequency: string | null;
  strength: string | null;
  duration: string | null;
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
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [viewerFileUrl, setViewerFileUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fitZoom, setFitZoom] = useState(100);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartY, setPanStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  console.log("[MyPrescriptionsClient] Received prescriptions:", {
    count: prescriptions.length,
    prescriptions: prescriptions,
  });

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
  }, [fileViewerOpen, viewerFileUrl]);

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

  const openFileViewer = (fileUrl: string) => {
    setViewerFileUrl(fileUrl);
    setFileViewerOpen(true);
    setZoomLevel(100);
    setPanX(0);
    setPanY(0);
  };

  const closeFileViewer = () => {
    setFileViewerOpen(false);
    setViewerFileUrl(null);
    setZoomLevel(100);
    setPanX(0);
    setPanY(0);
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
                    <div className="space-y-3 max-w-sm">
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
                      <button
                        onClick={() => prescription.file_url && openFileViewer(prescription.file_url)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm"
                      >
                        <Download className="w-4 h-4" />
                        View File
                      </button>
                    </div>
                  )}

                  {/* Prescription Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <p className="text-gray-500">Duration</p>
                                <p className="font-medium text-gray-900">
                                  {item.duration || "N/A"}
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

      {/* File Viewer Modal */}
      {fileViewerOpen && viewerFileUrl && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-auto max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Prescription File Viewer
              </h3>
              <button
                onClick={closeFileViewer}
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
              <span className="text-sm font-medium text-gray-700 w-12 text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
              >
                +
              </button>
            </div>

            {/* Content */}
            <div
              ref={containerRef}
              className="flex-1 overflow-hidden bg-gray-200 flex items-center justify-center relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                cursor: isPanning ? "grabbing" : zoomLevel > fitZoom ? "grab" : "auto",
              }}
            >
              {viewerFileUrl.includes(".pdf") ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <Download className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">PDF files cannot be previewed</p>
                    <p className="text-sm text-gray-300 mt-2">Use the View File button to open the PDF</p>
                  </div>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imgRef}
                  src={viewerFileUrl}
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
      )}
    </div>
  );
}
