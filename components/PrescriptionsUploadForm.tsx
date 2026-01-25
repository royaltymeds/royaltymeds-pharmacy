"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, AlertCircle, CheckCircle, FileText, X, Loader } from "lucide-react";
import { revalidatePrescriptionsPath } from "@/lib/actions";
import { generatePrescriptionNumber } from "@/lib/prescription-number";

export function PrescriptionsUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);

      // Generate preview
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type === "application/pdf") {
        setPreview("pdf");
      } else {
        setPreview(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileName("");
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      // Generate prescription number using browser time
      const prescriptionNumber = generatePrescriptionNumber();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("prescription_number", prescriptionNumber);

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
      setPreview(null);

      // Trigger page refresh to update prescriptions list
      await revalidatePrescriptionsPath();

      // Reset after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setError("An error occurred during upload");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Prescription</h3>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <p className="text-gray-600 text-sm">
          Upload a clear image or PDF of your prescription for pharmacy review
        </p>

        {/* File Preview */}
        {preview && (
          <div className="relative bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
            {preview === "pdf" ? (
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
                  src={preview}
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
        {!preview && (
          <div className="border-2 border-dashed border-green-300 rounded-lg p-6 sm:p-8 hover:border-green-400 transition">
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
                Click to upload or drag file
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">PDF, JPG, or PNG (Max 10MB)</p>
            </button>
          </div>
        )}

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
          className="px-6 py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition w-auto flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Prescription'
          )}
        </button>
      </form>

      {success && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-900">Prescription Uploaded!</h4>
            <p className="text-sm text-gray-600 mt-1">
              Your prescription has been uploaded successfully. Our pharmacists will review it shortly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
