import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Doctor Dashboard - RoyaltyMeds",
  description: "RoyaltyMeds doctor dashboard",
};

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch (error) {
            console.error("Cookie error:", error);
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Verify user is doctor
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "doctor") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Doctor Navigation */}
      <nav className="bg-blue-600 border-b border-blue-700 shadow-lg sticky top-0 z-40">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
              <Link href="/doctor/dashboard" className="font-semibold text-sm sm:text-base md:text-lg text-white whitespace-nowrap truncate flex-shrink-0">
                <span className="text-blue-300">R</span><span className="hidden sm:inline">oyaltyMeds</span>
              </Link>
              <div className="hidden lg:flex space-x-1">
                <Link href="/doctor/dashboard" className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-700">
                  Dashboard
                </Link>
                <Link href="/doctor/submit-prescription" className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-700">
                  Submit
                </Link>
                <Link href="/doctor/my-prescriptions" className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-700">
                  Prescriptions
                </Link>
                <Link href="/doctor/patients" className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-700">
                  Patients
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              <span className="hidden sm:inline text-xs md:text-sm text-blue-100 truncate max-w-[150px]">{user.email}</span>
              <Link href="/api/auth/logout" className="text-xs md:text-sm text-blue-100 hover:text-white font-medium whitespace-nowrap"
              >
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
  );
}
