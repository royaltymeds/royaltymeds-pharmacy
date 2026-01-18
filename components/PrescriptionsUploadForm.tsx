"use client";

import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";

export function PrescriptionsUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-900">Prescription Uploaded!</h4>
            <p className="text-sm text-gray-600 mt-1">
              Your prescription has been uploaded successfully. Our pharmacists will review it shortly.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <p className="text-gray-600 text-sm">
          Upload a clear image or PDF of your prescription for pharmacy review
        </p>

        {/* File Upload */}
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
          className="px-6 py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition w-auto"
        >
          {isLoading ? "Uploading..." : "Upload Prescription"}
        </button>
      </form>
    </div>
  );
}
