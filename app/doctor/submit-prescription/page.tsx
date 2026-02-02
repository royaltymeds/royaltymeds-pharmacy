"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle, Plus, Trash2, Loader, X, Upload, FileText, ChevronDown } from "lucide-react";
import Image from "next/image";
import { generatePrescriptionNumber } from "@/lib/prescription-number";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  quantity: string;
  frequency: string;
  duration: string;
  notes: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([
    { id: "1", name: "", dosage: "", quantity: "", frequency: "once daily", duration: "", notes: "" },
  ]);
  const [expandedMedications, setExpandedMedications] = useState<Set<string>>(new Set(["1"]));
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: initialPatientId || "",
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

      if (!fileUrl) {
        setError("Please upload a prescription file");
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

      // Validate that each medication has duration
      if (validMeds.some(m => !m.duration.trim())) {
        setError("Please fill in duration for all medications");
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
          notes: formData.notes,
          duration: validMeds[0]?.duration || null,
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
        patientId: "",
        notes: "",
      });
      setMedications([
        { id: "1", name: "", dosage: "", quantity: "", frequency: "once daily", duration: "", notes: "" },
      ]);
      setFileUrl("");
      setFileName("");
      setFilePreview(null);

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

  const addMedication = () => {
    const newId = String(Math.max(...medications.map(m => parseInt(m.id) || 0)) + 1);
    const newMed = { id: newId, name: "", dosage: "", quantity: "", frequency: "once daily", duration: "", notes: "" };
    setMedications([...medications, newMed]);
    setExpandedMedications(new Set([...expandedMedications, newId]));
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
    const updated = new Set(expandedMedications);
    updated.delete(id);
    setExpandedMedications(updated);
  };

  const updateMedication = (id: string, field: string, value: string) => {
    setMedications(
      medications.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  const toggleMedicationExpanded = (id: string) => {
    const updated = new Set(expandedMedications);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setExpandedMedications(updated);
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
            {medications.map((med, index) => {
              const isExpanded = expandedMedications.has(med.id);
              return (
                <div key={med.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Card Header */}
                  <button
                    type="button"
                    onClick={() => toggleMedicationExpanded(med.id)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition text-left"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">
                        Medication {index + 1}
                        {med.name && <span className="text-gray-500 ml-2">• {med.name}</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMedication(med.id);
                          }}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-gray-600 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Card Content */}
                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Duration <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) =>
                            updateMedication(med.id, "duration", e.target.value)
                          }
                          placeholder="e.g., 7 days, 2 weeks"
                          className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Instructions
                        </label>
                        <textarea
                          value={med.notes}
                          onChange={(e) =>
                            updateMedication(med.id, "notes", e.target.value)
                          }
                          placeholder="e.g., Take with food, avoid dairy"
                          rows={2}
                          className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
      </form>
      </div>
    </div>
  );
}
