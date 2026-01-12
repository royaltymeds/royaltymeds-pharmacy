"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search, FileText, AlertCircle } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  prescriptionCount: number;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const results = patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
    );
    setFilteredPatients(results);
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/doctor/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
        setFilteredPatients(data);
      } else {
        setError("Failed to load patients");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      setError("An error occurred while loading patients");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-indigo-600">
        <h1 className="text-2xl font-bold text-gray-900">Your Patients</h1>
        <p className="text-gray-600 mt-2">
          View and manage your patient list
        </p>
      </div>

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

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 mt-4">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {searchTerm ? "No patients found" : "No patients yet"}
            </h3>
            <p className="text-gray-600 mt-2">
              {searchTerm
                ? "Try adjusting your search terms"
                : "You haven't added any patients yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Prescriptions
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {patient.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.phone || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium text-gray-900">
                          {patient.prescriptionCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href="/doctor/submit-prescription"
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                      >
                        New Prescription
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      {!loading && patients.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Total Patients</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {patients.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Search Results</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {filteredPatients.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Total Prescriptions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {patients.reduce((sum, p) => sum + p.prescriptionCount, 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
