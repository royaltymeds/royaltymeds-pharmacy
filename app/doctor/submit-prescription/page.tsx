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
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => selectPatient(patient.id, patient.email)}
                    className="w-full text-left px-3 sm:px-4 py-2 hover:bg-blue-50 border-b last:border-b-0 text-sm"
                  >
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{patient.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {formData.patientId && (
            <p className="text-xs sm:text-sm text-green-600 mt-2">✓ Patient selected</p>
          )}
        </div>

        {/* Medication Name & Dosage - 2 Column on Tablet+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Medication Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="medicationName"
              value={formData.medicationName}
              onChange={handleChange}
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
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              placeholder="e.g., 500mg"
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Quantity & Frequency - 2 Column on Tablet+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
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
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
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

        {/* Instructions & Notes - 2 Column on Tablet+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="e.g., Take with food"
              rows={2}
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
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
