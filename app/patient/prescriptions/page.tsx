"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Prescription {
  id: string;
  medication_name: string;
  status: string;
  created_at: string;
  file_url?: string;
}

export default function PrescriptionsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"upload" | "view">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  useEffect(() => {
    if (activeTab === "view") {
      loadPrescriptions();
    }
  }, [activeTab]);

  const loadPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const response = await fetch("/api/patient/prescriptions", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (error) {
      console.error("Error loading prescriptions:", error);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/patient/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Upload failed");
        return;
      }

      setSuccess(true);
      setFile(null);
      setFileName("");

      // Reload prescriptions list
      loadPrescriptions();

      // Reset after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setActiveTab("view");
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setError("An error occurred during upload");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-600">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Prescriptions</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          Upload new prescriptions or view your existing prescriptions
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 px-4 py-3 text-sm sm:text-base font-medium transition ${
              activeTab === "upload"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Upload Prescription
          </button>
          <button
            onClick={() => setActiveTab("view")}
            className={`flex-1 px-4 py-3 text-sm sm:text-base font-medium transition ${
              activeTab === "view"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            View Prescriptions
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {/* Upload Tab */}
          {activeTab === "upload" && (
            <>
              {success && (
                <div className="space-y-4 sm:space-y-6 mb-6">
                  <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-600">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <CheckCircle className="w-8 sm:w-12 h-8 sm:h-12 text-green-600 flex-shrink-0 mt-1" />
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Prescription Uploaded!</h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                          Your prescription has been uploaded successfully. Our pharmacists will review it shortly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="text-gray-600 text-xs sm:text-sm">
                  Upload a clear image or PDF of your prescription for pharmacy review
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-green-300 rounded-lg p-6 sm:p-8">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-center"
                  >
                    <Upload className="w-8 sm:w-12 h-8 sm:h-12 text-green-600 mx-auto mb-3" />
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {fileName || "Click to upload or drag file"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">PDF, JPG, or PNG (Max 10MB)</p>
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !file}
                  className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? "Uploading..." : "Upload Prescription"}
                </button>
              </form>
            </>
          )}

          {/* View Tab */}
          {activeTab === "view" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Prescriptions</h3>
              
              {loadingPrescriptions ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-green-600"></div>
                  <p className="text-gray-600 mt-2">Loading prescriptions...</p>
                </div>
              ) : prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {rx.medication_name || "Prescription"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(rx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                            rx.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : rx.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {rx.status?.charAt(0).toUpperCase() + rx.status?.slice(1)}
                        </span>
                      </div>
                      {rx.file_url && (
                        <Link
                          href={rx.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-xs text-blue-600 hover:underline"
                        >
                          View File →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">
                  No prescriptions found.{" "}
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="text-green-600 hover:underline font-medium"
                  >
                    Upload one
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
