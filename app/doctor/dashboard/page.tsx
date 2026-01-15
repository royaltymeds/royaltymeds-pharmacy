"use client";

import { useState, useEffect } from "react";
import { Loader, FileText, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalPrescriptions: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  totalPatients: number;
}

export default function DoctorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/doctor/stats", {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized - please log in again");
          }
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error loading stats:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const quickActions = [
    {
      title: "Submit Prescription",
      description: "Send a prescription to pharmacy for processing",
      href: "/doctor/submit-prescription",
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Track Status",
      description: "Check prescription approval and dispensing status",
      href: "/doctor/my-prescriptions",
      icon: CheckCircle,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Patient Search",
      description: "Look up patient records and history",
      href: "/doctor/patients",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-l-4 border-blue-600">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Doctor Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              Submit prescriptions and track pharmacy approval status
            </p>
          </div>
          <Link href="/" className="flex-shrink-0 text-blue-600 hover:text-blue-700 font-medium text-xs md:text-sm whitespace-nowrap">
            ← Home
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Prescriptions */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-t-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">
                Total
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                {stats.totalPrescriptions}
              </p>
            </div>
            <FileText className="h-8 w-8 md:h-10 md:w-10 text-blue-600 flex-shrink-0" />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-t-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">
                Pending
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                {stats.pendingApproval}
              </p>
            </div>
            <Clock className="h-8 w-8 md:h-10 md:w-10 text-yellow-600 flex-shrink-0" />
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-t-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Approved</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                {stats.approved}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-green-600 flex-shrink-0" />
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-t-4 border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Rejected</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                {stats.rejected}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 md:h-10 md:w-10 text-red-600 flex-shrink-0" />
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-t-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Patients</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                {stats.totalPatients}
              </p>
            </div>
            <Users className="h-8 w-8 md:h-10 md:w-10 text-blue-600 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition"
              >
                <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pharmacy Workflow</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                1
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Submit to Pharmacy
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Submit prescriptions with patient details, medication, and dosage. Include special instructions for pharmacist.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-yellow-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600 text-white text-sm font-bold">
                2
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Pharmacist Review
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Pharmacy checks for interactions, coverage, and patient allergies. Status updates to pending review.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold">
                3
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Approve or Request Changes
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Pharmacy approves for dispensing or requests dosage/medication modifications. Check status updates in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
