import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileSidebar } from "@/components/MobileSidebar";
import { createServerSupabaseClient, createServerAdminClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

async function getDoctorEmail() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || null;
  } catch (error) {
    return null;
  }
}

async function getDoctorRole() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Use service role to bypass RLS
    const adminClient = await createServerAdminClient();
    const { data: userData } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    
    // console.log("[DoctorLayout] getDoctorRole - userId:", user.id, "userData:", userData, "error:", error?.message);
    
    return (userData as any)?.role || null;
  } catch (error) {
    console.error("[DoctorLayout] getDoctorRole error:", error);
    return null;
  }
}

export default async function DoctorLayout({
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

  const userEmail = await getDoctorEmail();
  const userRole = await getDoctorRole();
  
  // console.log("[DoctorLayout] User role check - role:", userRole, "email:", userEmail);
  
  // Redirect non-doctors to appropriate portals
  if (userRole !== "doctor") {
    // console.log("[DoctorLayout] Non-doctor user trying to access doctor portal, userRole:", userRole, "redirecting");
    if (userRole === "admin") {
      redirect("/admin/dashboard");
    }
    redirect("/patient/home");
  }

  const navLinks = [
    { href: "/doctor/dashboard", label: "Dashboard" },
    { href: "/doctor/submit-prescription", label: "Send Prescription" },
    { href: "/doctor/my-prescriptions", label: "View Prescriptions" },
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

            <div className="hidden lg:flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              {/* <Link href="/patient/home" className="text-xs md:text-sm text-blue-100 hover:text-white font-medium whitespace-nowrap px-2 py-1 rounded-md hover:bg-blue-700 transition">
                My Customer Portal
              </Link> */}
              <span className="hidden sm:inline text-xs md:text-sm text-blue-100 truncate max-w-[150px]">{userEmail}</span>
              <LogoutButton className="text-xs md:text-sm text-blue-100 hover:text-white font-medium whitespace-nowrap" />
            </div>

            <MobileSidebar navLinks={navLinks} userEmail={userEmail} LogoutButton={LogoutButton} extraLinks={[{ href: "/", label: "Home" }]} />
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
