"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    totalPatients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/doctor/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: "Submit Prescription",
      description: "Create a new prescription for a patient",
      href: "/doctor/submit-prescription",
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "View Patients",
      description: "Browse and manage your patients",
      href: "/doctor/patients",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "My Prescriptions",
      description: "Review all prescriptions you've submitted",
      href: "/doctor/my-prescriptions",
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage prescriptions and communicate with your patients
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Prescriptions */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">
                Total Prescriptions
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {loading ? "-" : stats.totalPrescriptions}
              </p>
            </div>
            <FileText className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">
                Pending Review
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {loading ? "-" : stats.pendingApproval}
              </p>
            </div>
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Approved</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {loading ? "-" : stats.approved}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Rejected</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {loading ? "-" : stats.rejected}
              </p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Patients</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {loading ? "-" : stats.totalPatients}
              </p>
            </div>
            <Users className="h-10 w-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                1
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Submit Your First Prescription
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Click on &quot;Submit Prescription&quot; to create a new prescription for
                one of your patients.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold">
                2
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Track Prescription Status
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Go to &quot;My Prescriptions&quot; to view the status of all prescriptions
                you&apos;ve submitted. You&apos;ll see when they&apos;re approved or rejected.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                3
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Manage Your Patient List
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Visit &quot;Patients&quot; to view and search your patient list, and see
                their prescription history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
