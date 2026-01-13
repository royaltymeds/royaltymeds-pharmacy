"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getEmail() {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
      }
    }
    getEmail();
  }, []);

  const navLinks = [
    { href: "/doctor/dashboard", label: "Dashboard" },
    { href: "/doctor/submit-prescription", label: "Submit Rx" },
    { href: "/doctor/my-prescriptions", label: "Prescriptions" },
    { href: "/doctor/patients", label: "Patients" },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white flex flex-col">
      {/* Doctor Navigation */}
      <nav className="bg-blue-600 border-b border-blue-700 shadow-lg sticky top-0 z-50">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
              <Link href="/doctor/dashboard" className="font-semibold text-sm sm:text-base md:text-lg text-white whitespace-nowrap truncate flex-shrink-0">
                <span className="text-blue-300">R</span><span>oyaltyMeds</span>
              </Link>
              <div className="hidden lg:flex space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              <span className="hidden sm:inline text-xs md:text-sm text-blue-100 truncate max-w-[150px]">{userEmail}</span>
              <Link href="/api/auth/logout" className="text-xs md:text-sm text-blue-100 hover:text-white font-medium whitespace-nowrap">
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      </div>
    </AuthGuard>
  );
}
