"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, X, Upload, FileText } from "lucide-react";
import Image from "next/image";
import { generatePrescriptionNumber } from "@/lib/prescription-number";

export default function SubmitPrescription() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (!fileUrl) {
        setError("Please upload a prescription file");
        setLoading(false);
        return;
      }

      // Generate prescription number using browser time
      const prescriptionNumber = generatePrescriptionNumber();

      const response = await fetch("/api/doctor/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prescriptionNumber,
          notes: formData.notes,
          file_url: fileUrl,
          file_name: fileName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit prescription");
      }

      setSuccess(true);
      setFormData({
        notes: "",
      });
      setFileUrl("");
      setFileName("");
      setFilePreview(null);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/doctor/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      // Generate preview
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        setFilePreview("pdf");
      }

      const response = await fetch("/api/doctor/upload", {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "File upload failed");
      }

      const data = await response.json();
      setFileUrl(data.file_url);
      setFileName(file.name);
    } catch (err: any) {
      setError("Failed to upload file: " + err.message);
      setFileUrl("");
      setFileName("");
      setFilePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const clearFile = () => {
    setFileUrl("");
    setFileName("");
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full px-0">
      <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 border-l-4 border-blue-600">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Submit Prescription</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          Upload your prescription file and add any notes for the pharmacy
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">

        {/* Additional Notes */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional notes"
            rows={2}
            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Prescription File Upload */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Prescription File <span className="text-red-500">*</span>
          </label>

          {/* File Preview */}
          {filePreview && (
            <div className="relative bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 mb-4">
              {filePreview === "pdf" ? (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center w-16 h-20 bg-red-100 rounded">
                    <FileText className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                    <p className="text-xs text-gray-500">PDF Document</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Image
                    src={filePreview}
                    alt="Preview"
                    width={600}
                    height={400}
                    className="w-full h-auto max-h-80 object-contain rounded"
                  />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          {!filePreview && (
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 sm:p-8 hover:border-blue-400 transition">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                disabled={uploading}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full text-center cursor-pointer disabled:cursor-not-allowed"
              >
                <Upload className="w-8 sm:w-12 h-8 sm:h-12 text-blue-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  {uploading ? "Uploading..." : "Click to upload or drag file"}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">PDF, JPG, or PNG (Max 10MB)</p>
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-start">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? "Submitting..." : "Submit Prescription"}
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 sm:gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">
                Prescription submitted successfully!
              </h3>
              <p className="text-green-700 text-sm mt-1">
                You will be redirected to your prescriptions in a moment.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 sm:gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 text-sm sm:text-base">Error</h3>
              <p className="text-red-700 text-xs sm:text-sm mt-1">{error}</p>
            </div>
          </div>
        )}
      </form>
      </div>
    </div>
  );
}
