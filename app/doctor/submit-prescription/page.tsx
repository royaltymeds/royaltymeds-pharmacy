"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle, Plus, Trash2, Loader } from "lucide-react";
import { generatePrescriptionNumber } from "@/lib/prescription-number";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  quantity: string;
  frequency: string;
}

interface Patient {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
}

export default function SubmitPrescription() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get("patientId");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([
    { id: "1", name: "", dosage: "", quantity: "", frequency: "once daily" },
  ]);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const [formData, setFormData] = useState({
    patientId: initialPatientId || "",
    duration: "",
    instructions: "",
    notes: "",
  });

  // Load linked patients
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await fetch("/api/doctor/linked-patients");
        if (res.ok) {
          const data = await res.json();
          setPatients(data.patients || []);
        }
      } catch (error) {
        console.error("Error loading patients:", error);
        setError("Failed to load your patients");
      } finally {
        setLoadingPatients(false);
      }
    };

    loadPatients();
  }, []);

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
      if (!formData.patientId) {
        setError("Please select a patient");
        setLoading(false);
        return;
      }

      // Filter out empty medications
      const validMeds = medications.filter(m => m.name.trim());
      if (validMeds.length === 0) {
        setError("Please add at least one medication");
        setLoading(false);
        return;
      }

      if (!formData.duration) {
        setError("Please fill in duration");
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
          patientId: formData.patientId,
          prescriptionNumber,
          medications: validMeds,
          duration: formData.duration,
          instructions: formData.instructions,
          notes: formData.notes,
          file_url: fileUrl || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit prescription");
      }

      setSuccess(true);
      setFormData({
        patientId: "",
        duration: "",
        instructions: "",
        notes: "",
      });
      setMedications([
        { id: "1", name: "", dosage: "", quantity: "", frequency: "once daily" },
      ]);
      setFileUrl("");
      setFileName("");

      // Redirect to my-prescriptions after 2 seconds
      setTimeout(() => {
        router.push("/doctor/my-prescriptions");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/patient/upload", {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      const data = await response.json();
      setFileUrl(data.file_url);
      setFileName(file.name);
    } catch (err: any) {
      setError("Failed to upload file: " + err.message);
      setFileUrl("");
      setFileName("");
    } finally {
      setUploading(false);
    }
  };

  const addMedication = () => {
    const newId = String(Math.max(...medications.map(m => parseInt(m.id) || 0)) + 1);
    setMedications([
      ...medications,
      { id: newId, name: "", dosage: "", quantity: "", frequency: "once daily" },
    ]);
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const updateMedication = (id: string, field: string, value: string) => {
    setMedications(
      medications.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  const selectedPatient = patients.find(p => p.id === formData.patientId);

  return (
    <div className="w-full px-0">
      <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 border-l-4 border-blue-600">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Submit Prescription</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          Create and submit a new prescription to the pharmacy for processing
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 sm:gap-3">
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
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 sm:gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 text-sm sm:text-base">Error</h3>
            <p className="text-red-700 text-xs sm:text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        {/* Patient Selection */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Select Patient <span className="text-red-500">*</span>
          </label>
          {loadingPatients ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <Loader className="h-4 w-4 animate-spin text-gray-600" />
              <p className="text-sm text-gray-600">Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                No patients linked yet.{" "}
                <a href="/doctor/patients" className="font-medium underline">
                  Go to your patients page to link or create patients.
                </a>
              </p>
            </div>
          ) : (
            <select
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              required
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a patient --</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName} ({patient.email})
                </option>
              ))}
            </select>
          )}
          {selectedPatient && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-900">
                <span className="font-medium">Selected:</span> {selectedPatient.fullName} • {selectedPatient.email}
                {selectedPatient.phone && <> • {selectedPatient.phone}</>}
              </p>
            </div>
          )}
        </div>

        {/* Medication Name & Dosage - 2 Column on Tablet+ */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Medications <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addMedication}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add Medication
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((med, index) => (
              <div key={med.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Medication {index + 1}
                  </span>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(med.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Medication Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) =>
                        updateMedication(med.id, "name", e.target.value)
                      }
                      placeholder="e.g., Amoxicillin"
                      className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Dosage <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) =>
                        updateMedication(med.id, "dosage", e.target.value)
                      }
                      placeholder="e.g., 500mg"
                      className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={med.quantity}
                      onChange={(e) =>
                        updateMedication(med.id, "quantity", e.target.value)
                      }
                      placeholder="e.g., 30 tablets"
                      className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      value={med.frequency}
                      onChange={(e) =>
                        updateMedication(med.id, "frequency", e.target.value)
                      }
                      className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>once daily</option>
                      <option>twice daily</option>
                      <option>three times daily</option>
                      <option>four times daily</option>
                      <option>every 6 hours</option>
                      <option>every 8 hours</option>
                      <option>every 12 hours</option>
                      <option>as needed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Duration <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="e.g., 7 days, 2 weeks"
            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Instructions */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Instructions
          </label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            placeholder="Any special instructions"
            rows={2}
            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

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
            Prescription File (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              accept="image/*,.pdf"
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex items-center justify-center gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {uploading ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>
            </label>
          </div>
          {fileName && (
            <p className="mt-2 text-sm text-green-600">✓ File uploaded: {fileName}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 text-sm sm:text-base rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? "Submitting..." : "Submit Prescription"}
        </button>
      </form>
      </div>
    </div>
  );
}
