"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";

// Custom storage for browser client to sync cookies properly
class CookieStorage {
  getItem(key: string): string | null {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${key}=`))
      ?.split("=")[1];
    return value ? decodeURIComponent(value) : null;
  }

  setItem(key: string, value: string): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  removeItem(key: string): void {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: new CookieStorage(),
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const navLinks = [
    { href: "/doctor/dashboard", label: "Dashboard" },
    { href: "/doctor/submit-prescription", label: "Submit Rx" },
    { href: "/doctor/my-prescriptions", label: "Prescriptions" },
    { href: "/doctor/patients", label: "Patients" },
  ];

  return (
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

            {/* Hamburger Button - Mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-blue-100 hover:text-white hover:bg-blue-700 rounded-md transition"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <div className="hidden lg:flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              <span className="hidden sm:inline text-xs md:text-sm text-blue-100 truncate max-w-[150px]">{user.email}</span>
              <Link href="/api/auth/logout" className="text-xs md:text-sm text-blue-100 hover:text-white font-medium whitespace-nowrap">
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-blue-700 shadow-lg z-40 lg:hidden transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className="block px-4 py-3 rounded-md text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-600 transition"
            >
              {link.label}
            </Link>
          ))}
          <hr className="my-4 border-blue-600" />
          <div className="px-4 py-3 text-xs text-blue-100 break-all">{user.email}</div>
          <Link
            href="/api/auth/logout"
            className="block px-4 py-3 rounded-md text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-600 transition"
          >
            Logout
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
