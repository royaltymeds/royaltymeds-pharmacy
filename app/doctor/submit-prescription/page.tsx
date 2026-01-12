"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function SubmitPrescription() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [formData, setFormData] = useState({
    patientId: "",
    patientEmail: "",
    medicationName: "",
    dosage: "",
    quantity: "",
    frequency: "once daily",
    duration: "",
    instructions: "",
    notes: "",
  });

  const handlePatientSearch = async (email: string) => {
    if (!email.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(`/api/doctor/patients?search=${email}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Patient search failed:", error);
    }
  };

  const selectPatient = (patientId: string, patientEmail: string) => {
    setFormData({ ...formData, patientId, patientEmail });
    setShowSearchResults(false);
    setSearchResults([]);
  };

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

      if (
        !formData.medicationName ||
        !formData.dosage ||
        !formData.quantity ||
        !formData.duration
      ) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/doctor/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit prescription");
      }

      setSuccess(true);
      setFormData({
        patientId: "",
        patientEmail: "",
        medicationName: "",
        dosage: "",
        quantity: "",
        frequency: "once daily",
        duration: "",
        instructions: "",
        notes: "",
      });

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-indigo-600">
        <h1 className="text-2xl font-bold text-gray-900">Submit Prescription</h1>
        <p className="text-gray-600 mt-2">
          Create and submit a new prescription for your patient
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
        {/* Patient Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              name="patientEmail"
              value={formData.patientEmail}
              onChange={(e) => {
                handleChange(e);
                handlePatientSearch(e.target.value);
              }}
              placeholder="Search patients by email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => selectPatient(patient.id, patient.email)}
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 border-b last:border-b-0"
                  >
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-500">{patient.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {formData.patientId && (
            <p className="text-sm text-green-600 mt-2">✓ Patient selected</p>
          )}
        </div>

        {/* Medication Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medication Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="medicationName"
            value={formData.medicationName}
            onChange={handleChange}
            placeholder="e.g., Amoxicillin, Ibuprofen"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        {/* Dosage */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dosage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="dosage"
            value={formData.dosage}
            onChange={handleChange}
            placeholder="e.g., 500mg, 1 tablet"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        {/* Quantity */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="e.g., 30 tablets, 1 bottle"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        {/* Frequency */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency
          </label>
          <select
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

        {/* Duration */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="e.g., 7 days, 2 weeks, 30 days"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructions
          </label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            placeholder="e.g., Take with food, Do not use with alcohol"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional notes or comments"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Submitting..." : "Submit Prescription"}
        </button>
      </form>
    </div>
  );
}
