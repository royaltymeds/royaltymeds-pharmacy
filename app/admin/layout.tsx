import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

async function getAdminEmail() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || null;
  } catch (error) {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check auth server-side - redirect if not authenticated
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const userEmail = await getAdminEmail();

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/prescriptions", label: "Prescriptions" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/refills", label: "Refills" },
    { href: "/admin/doctors", label: "Doctors" },
    { href: "/admin/users", label: "Pharmacists" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Navigation */}
      <nav className="bg-green-600 border-b border-green-700 shadow-lg sticky top-0 z-50">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
              <Link href="/admin/dashboard" className="font-semibold text-sm sm:text-base md:text-lg text-white whitespace-nowrap truncate flex-shrink-0">
                <span className="text-green-300">R</span><span>oyaltyMeds</span>
              </Link>
              <div className="hidden lg:flex space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-green-100 hover:text-white hover:bg-green-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              <span className="hidden sm:inline text-xs md:text-sm text-green-100 truncate max-w-[150px]">{userEmail}</span>
              <LogoutButton className="text-xs md:text-sm text-green-100 hover:text-white font-medium whitespace-nowrap" />
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
