import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard - RoyaltyMeds",
  description: "RoyaltyMeds admin dashboard",
};

export default async function AdminLayout({
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

  // Verify user is admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <nav className="bg-green-600 border-b border-green-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin/dashboard" className="font-semibold text-lg text-white">
                <span className="text-green-300">R</span>oyaltyMeds Pharmacy
              </Link>
              <div className="hidden md:flex space-x-1">
                <Link
                  href="/admin/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-green-100 hover:text-white hover:bg-green-700"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/prescriptions"
                  className="px-3 py-2 rounded-md text-sm font-medium text-green-100 hover:text-white hover:bg-green-700"
                >
                  Prescriptions
                </Link>
                <Link
                  href="/admin/orders"
                  className="px-3 py-2 rounded-md text-sm font-medium text-green-100 hover:text-white hover:bg-green-700"
                >
                  Orders
                </Link>
                <Link
                  href="/admin/refills"
                  className="px-3 py-2 rounded-md text-sm font-medium text-green-100 hover:text-white hover:bg-green-700"
                >
                  Refills
                </Link>
                <Link
                  href="/admin/doctors"
                  className="px-3 py-2 rounded-md text-sm font-medium text-green-100 hover:text-white hover:bg-green-700"
                >
                  Doctors
                </Link>
                <Link
                  href="/admin/users"
                  className="px-3 py-2 rounded-md text-sm font-medium text-green-100 hover:text-white hover:bg-green-700"
                >
                  Pharmacists
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-green-100">{user.email}</span>
              <Link
                href="/api/auth/logout"
                className="text-sm text-green-100 hover:text-white font-medium"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
