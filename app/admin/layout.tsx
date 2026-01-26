import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileSidebar } from "@/components/MobileSidebar";
import { DesktopNav } from "@/components/DesktopNav";
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
    { href: "/admin/inventory", label: "Inventory" },
    { href: "/admin/doctors", label: "Doctors" },
    { href: "/admin/users", label: "Pharmacists" },
    { href: "/admin/payments", label: "Payments Config" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Navigation */}
      <nav className="bg-white border-b-4 border-green-600 shadow-sm sticky top-0 z-50">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
              <Link href="/" className="font-semibold text-sm sm:text-base md:text-lg text-black whitespace-nowrap truncate flex-shrink-0 hover:text-green-600 transition">
                <span className="text-green-600">R</span><span>oyaltyMeds</span>
              </Link>
              <Link href="/" className="hidden sm:inline px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 transition whitespace-nowrap">
                Home
              </Link>
              <DesktopNav navLinks={navLinks} />
            </div>

            <div className="hidden lg:flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              <Link href="/patient/home" className="text-xs md:text-sm text-gray-700 hover:text-green-600 font-medium whitespace-nowrap px-2 py-1 rounded-md hover:bg-green-50 transition">
                My Customer Portal
              </Link>
              <span className="hidden sm:inline text-xs md:text-sm text-gray-600 truncate max-w-[150px]">{userEmail}</span>
              <LogoutButton className="text-xs md:text-sm text-gray-700 hover:text-green-600 font-medium whitespace-nowrap" />
            </div>

            <MobileSidebar navLinks={navLinks} userEmail={userEmail} LogoutButton={LogoutButton} extraLinks={[{ href: "/", label: "Home" }, { href: "/patient/home", label: "My Customer Portal" }]} />
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
