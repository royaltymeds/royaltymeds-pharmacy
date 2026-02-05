import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import {
  FileText,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DoctorDashboard() {
  // Auth check - page-level enforcement
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
  ];

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
