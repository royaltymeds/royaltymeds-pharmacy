"use client";

import { useState } from "react";
import { Search, FileText, Users } from "lucide-react";
import Link from "next/link";

interface Patient {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  prescriptionCount: number;
}

interface PatientsClientProps {
  initialPatients: Patient[];
}

export default function PatientsClient({
  initialPatients,
}: PatientsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = initialPatients.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      (patient.phone && patient.phone.includes(searchLower))
    );
  });

  return (
    <div>
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <Users className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              {searchTerm ? "No patients found" : "No patients yet"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {searchTerm
                ? "Try adjusting your search terms"
                : "You haven't added any patients yet."}
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
                    <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-900">
                      Prescriptions
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
                          {patient.name}
                        </p>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-xs md:text-sm text-gray-600 truncate">
                        {patient.email}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-xs md:text-sm text-gray-600">
                        {patient.phone || "-"}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="font-medium text-gray-900 text-xs md:text-sm">
                            {patient.prescriptionCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        <Link
                          href="/doctor/submit-prescription"
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs md:text-sm hover:bg-blue-700"
                        >
                          Submit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card view for mobile (only shown on sm and below) */}
            <div className="sm:hidden divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="p-4 hover:bg-gray-50 space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {patient.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {patient.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-900 text-sm">
                        {patient.prescriptionCount}
                      </span>
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
                      <p className="text-xs text-gray-500">Prescriptions</p>
                      <p className="text-gray-900 font-medium">
                        {patient.prescriptionCount}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/doctor/submit-prescription"
                    className="block w-full py-2 text-center bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                  >
                    Submit Prescription
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      {filteredPatients.length > 0 && (
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-xs sm:text-sm">Total Patients</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {initialPatients.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-xs sm:text-sm">Search Results</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {filteredPatients.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-xs sm:text-sm">Total Prescriptions</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {initialPatients.reduce((sum, p) => sum + p.prescriptionCount, 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
