import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Customer Portal - RoyaltyMeds",
  description: "Your RoyaltyMeds customer portal",
};

export default async function PatientLayout({
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Customer Portal Navigation */}
      <nav className="bg-green-600 border-b border-green-700 shadow-lg sticky top-0 z-40">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
              <Link href="/patient/home" className="font-semibold text-sm sm:text-base md:text-lg text-white whitespace-nowrap truncate flex-shrink-0">
                <span className="text-green-300">R</span><span className="hidden sm:inline">oyaltyMeds</span>
              </Link>
              <div className="hidden lg:flex space-x-1">
                <Link href="/patient/home" className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-green-100 hover:text-white hover:bg-green-700">
                  Dashboard
                </Link>
                <Link href="/patient/prescriptions" className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-green-100 hover:text-white hover:bg-green-700">
                  Prescriptions
                </Link>
                <Link href="/patient/orders" className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-green-100 hover:text-white hover:bg-green-700">
                  Orders
                </Link>
                <Link href="/patient/refills" className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-green-100 hover:text-white hover:bg-green-700">
                  Refills
                </Link>
                <Link href="/patient/messages" className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-green-100 hover:text-white hover:bg-green-700">
                  Messages
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              <span className="hidden sm:inline text-xs md:text-sm text-green-100 truncate max-w-[150px]">{user.email}</span>
              <Link href="/api/auth/logout" className="text-xs md:text-sm text-green-100 hover:text-white font-medium whitespace-nowrap">
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
