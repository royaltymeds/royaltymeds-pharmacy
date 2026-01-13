"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function UploadPrescriptionPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [brandChoice, setBrandChoice] = useState<"brand" | "generic" | null>(null);

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
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Authentication failed");
        return;
      }

      // Upload file to storage
      const fileExtension = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(fileName, file);

      if (uploadError) {
        setError("File upload failed: " + uploadError.message);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("prescriptions").getPublicUrl(fileName);

      // Create prescription record
      const { data: prescription, error: dbError } = await (supabase
        .from("prescriptions")
        .insert({
          patient_id: user.id,
          medication_name: medication || null,
          dosage: dosage || null,
          quantity: quantity ? parseInt(quantity) : null,
          notes: notes || null,
          file_url: publicUrl,
          status: "pending",
        } as any)
        .select()
        .single() as any);

      if (dbError) {
        setError("Failed to create prescription: " + dbError.message);
        return;
      }

      // Store brand/generic preference if selected
      if (brandChoice && prescription) {
        await (supabase
          .from("prescription_items")
          .insert({
            prescription_id: prescription.id,
            medication_name: medication,
            quantity: quantity ? parseInt(quantity) : null,
            brand_preferred: brandChoice === "brand",
          } as any) as any);
      }

      setSuccess(true);
      setFile(null);
      setFileName("");
      setMedication("");
      setDosage("");
      setQuantity("");
      setNotes("");
      setBrandChoice(null);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/patient/home");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Prescription Uploaded!</h2>
              <p className="text-gray-600 mt-2">
                Your prescription has been uploaded successfully. Our pharmacists will review it shortly.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/patient/home"
          className="block text-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium max-w-xs mx-auto"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
        <h1 className="text-3xl font-bold text-gray-900">Upload Prescription</h1>
        <p className="text-gray-600 mt-2">
          Upload a clear image or PDF of your prescription for pharmacy review
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-green-300 rounded-lg p-8">
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
              <Upload className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="font-medium text-gray-900">
                {fileName || "Click to upload or drag file"}
              </p>
              <p className="text-sm text-gray-600 mt-1">PDF, JPG, or PNG (Max 10MB)</p>
            </button>
          </div>

          {/* Prescription Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medication Name (Optional)
              </label>
              <input
                type="text"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                placeholder="e.g., Metformin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage (Optional)
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 500mg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (Optional)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand / Generic
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBrandChoice("brand")}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                    brandChoice === "brand"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Brand
                </button>
                <button
                  type="button"
                  onClick={() => setBrandChoice("generic")}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                    brandChoice === "generic"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Generic
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !file}
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Uploading..." : "Upload Prescription"}
          </button>
        </form>
      </div>
    </div>
  );
}