'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, ChevronLeft, ChevronRight, CheckCircle, X, AlertCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface Prescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  status: string;
  created_at: string;
  source: "patient" | "doctor";
}

interface Props {
  prescriptions: Prescription[];
  initialPage: number;
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "partially_filled":
      return "bg-orange-100 text-orange-800";
    case "filled":
      return "bg-green-100 text-green-800";
    case "dispensing":
      return "bg-blue-100 text-blue-800";
    case "refill_requested":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending":
      return <AlertCircle className="w-4 h-4" />;
    case "approved":
      return <CheckCircle className="w-4 h-4" />;
    case "rejected":
      return <X className="w-4 h-4" />;
    case "processing":
      return <AlertCircle className="w-4 h-4" />;
    case "partially_filled":
      return <AlertCircle className="w-4 h-4" />;
    case "filled":
      return <CheckCircle className="w-4 h-4" />;
    case "dispensing":
      return <AlertCircle className="w-4 h-4" />;
    case "refill_requested":
      return <AlertCircle className="w-4 h-4" />;
    default:
      return null;
  }
}

export default function PrescriptionsClient({ prescriptions, initialPage }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Filter prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      const matchesSearch =
        rx.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rx.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rx.medication_name && rx.medication_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter ? rx.status === statusFilter : true;

      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, searchTerm, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPrescriptions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPrescriptions = filteredPrescriptions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Get all unique statuses
  const allStatuses = useMemo(() => {
    const statuses = new Set(prescriptions.map(rx => rx.status));
    return Array.from(statuses).sort();
  }, [prescriptions]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Prescription Management</h1>
          <p className="text-sm md:text-base text-gray-600">Review and manage all prescriptions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by prescription number, patient ID, or medication..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Filter size={18} />
              Filter by Status
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter(null)}
                className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                  statusFilter === null
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                All ({prescriptions.length})
              </button>
              {allStatuses.map((status) => {
                const count = prescriptions.filter(rx => rx.status === status).length;
                const showBadge = status === 'pending' || status === 'refill_requested';
                
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium flex items-center gap-2 ${
                      statusFilter === status
                        ? `text-white ${getStatusColor(status).split(' ')[0]}`
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                    style={{
                      backgroundColor: statusFilter === status ? undefined : undefined,
                    }}
                  >
                    <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                    {showBadge && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-white rounded-full text-gray-900">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs md:text-sm text-gray-600">
            Found {filteredPrescriptions.length} prescription{filteredPrescriptions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Prescriptions List */}
        {filteredPrescriptions.length > 0 ? (
          <>
            {/* Top Pagination Controls */}
            {totalPages > 1 && (
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 pointer-events-none"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  
                  <div className="flex gap-1 items-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-2 rounded text-xs font-medium transition ${
                          page === currentPage
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 pointer-events-none"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Prescriptions List */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {paginatedPrescriptions.map((rx) => (
                <div key={`${rx.source}-${rx.id}`} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 md:p-6 hover:shadow-md transition">
                  <div className="flex flex-col gap-3">
                    {/* First row: Number and Status */}
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-xs sm:text-sm font-mono">
                            Rx #{rx.prescription_number}
                          </p>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            rx.source === "patient" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                          }`}>
                            {rx.source === "patient" ? "Patient" : "Doctor"}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(
                          rx.status
                        )}`}
                      >
                        {getStatusIcon(rx.status)}
                        <span>{rx.status.charAt(0).toUpperCase() + rx.status.slice(1).replace(/_/g, ' ')}</span>
                      </span>
                    </div>

                    {/* Second row: Medication and Date */}
                    {rx.medication_name && (
                      <div className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Medication:</span> {rx.medication_name}
                      </div>
                    )}

                    {/* Third row: Date and Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        {new Date(rx.created_at).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/admin/prescriptions/${rx.id}`}
                        className="text-green-600 hover:text-green-700 font-medium text-xs whitespace-nowrap"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 pointer-events-none"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  
                  <div className="flex gap-1 items-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-2 rounded text-xs font-medium transition ${
                          page === currentPage
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 pointer-events-none"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center text-gray-600">
            <p className="text-sm">No prescriptions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
