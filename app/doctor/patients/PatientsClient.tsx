"use client";

import { useEffect, useState } from "react";
import { Search, Users, Plus, X, Loader } from "lucide-react";
import Link from "next/link";

interface Patient {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
}

export default function PatientsClient() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    address: "",
    dateOfBirth: "",
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
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // Search for patients to link
  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/doctor/search-patients?search=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : data.patients || []);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setSearching(false);
    }
  };

  // Link existing patient
  const handleLinkPatient = async (patientId: string) => {
    try {
      const res = await fetch("/api/doctor/linked-patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });

      if (res.ok) {
        const data = await res.json();
        setPatients([...patients, data.patient]);
        setSearchTerm("");
        setSearchResults([]);
        setShowLinkModal(false);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error linking patient:", error);
      alert("Failed to link patient");
    }
  };

  // Unlink patient
  const handleUnlinkPatient = async (patientId: string) => {
    if (!confirm("Are you sure you want to unlink this patient?")) return;

    setUnlinkingId(patientId);
    try {
      const res = await fetch("/api/doctor/linked-patients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });

      if (res.ok) {
        setPatients(patients.filter((p) => p.id !== patientId));
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error unlinking patient:", error);
      alert("Failed to unlink patient");
    } finally {
      setUnlinkingId(null);
    }
  };

  // Create new patient
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPatient(true);

    try {
      const res = await fetch("/api/doctor/create-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setPatients([...patients, data.patient]);
        setFormData({
          email: "",
          password: "",
          fullName: "",
          phone: "",
          address: "",
          dateOfBirth: "",
        });
        setShowCreateModal(false);
        alert("Patient created successfully!");
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      alert("Failed to create patient");
    } finally {
      setCreatingPatient(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.fullName.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      (patient.phone && patient.phone.includes(searchLower))
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          onClick={() => setShowLinkModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Link Existing Patient
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Create New Patient
        </button>
      </div>

      {/* Search Bar */}
      {patients.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Patients List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 text-center">
            <Loader className="h-10 w-10 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 text-sm">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <Users className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              {searchTerm ? "No patients found" : "No patients yet"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Link or create patients to get started"}
            </p>
          </div>
        ) : (
          <>
            {/* Table view for tablet+ */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-900">
                      Patient
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-900">
                      Phone
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 text-xs md:text-sm">
                        <p className="font-medium text-gray-900">
                          {patient.fullName}
                        </p>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-xs md:text-sm text-gray-600 truncate">
                        {patient.email}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-xs md:text-sm text-gray-600">
                        {patient.phone || "-"}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/doctor/submit-prescription?patientId=${patient.id}`}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs md:text-sm hover:bg-blue-700 inline-block"
                        >
                          Submit Rx
                        </Link>
                        <button
                          onClick={() => handleUnlinkPatient(patient.id)}
                          disabled={unlinkingId === patient.id}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs md:text-sm hover:bg-red-700 disabled:bg-gray-400 inline-block"
                        >
                          {unlinkingId === patient.id ? (
                            <Loader className="h-3 w-3 inline animate-spin" />
                          ) : (
                            "Unlink"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card view for mobile */}
            <div className="sm:hidden divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="p-4 hover:bg-gray-50 space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {patient.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {patient.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-gray-900 font-medium">
                        {patient.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-gray-900 font-medium text-xs">
                        {patient.address || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/doctor/submit-prescription?patientId=${patient.id}`}
                      className="flex-1 py-2 text-center bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                    >
                      Submit
                    </Link>
                    <button
                      onClick={() => handleUnlinkPatient(patient.id)}
                      disabled={unlinkingId === patient.id}
                      className="flex-1 py-2 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {unlinkingId === patient.id ? (
                        <Loader className="h-3 w-3 inline animate-spin" />
                      ) : (
                        "Unlink"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      {patients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-xs sm:text-sm">Total Patients</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {patients.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-xs sm:text-sm">Search Results</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {filteredPatients.length}
            </p>
          </div>
        </div>
      )}

      {/* Link Patient Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                Link Existing Patient
              </h2>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSearchTerm("");
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name (min 2 chars)..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {searching && (
              <div className="text-center py-4">
                <Loader className="h-6 w-6 text-blue-600 mx-auto animate-spin" />
              </div>
            )}

            {!searching && searchResults.length === 0 && searchTerm.length >= 2 && (
              <p className="text-sm text-gray-600 text-center py-4">
                No patients found
              </p>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {patient.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {patient.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLinkPatient(patient.id)}
                      className="ml-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex-shrink-0"
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Patient Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                Create New Patient
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPatient}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium flex items-center justify-center gap-2"
                >
                  {creatingPatient ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Patient"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
