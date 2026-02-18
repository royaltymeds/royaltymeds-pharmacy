import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { StoreMobileSidebar } from "./StoreMobileSidebar";
import { CartButtonWithBadge } from "./CartButtonWithBadge";
import { MobileCartIconButton } from "./MobileCartIconButton";
import { OrdersButton } from "./OrdersButton";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Store Navigation */}
      <nav className="bg-green-600 border-b border-green-700 shadow-lg sticky top-0 z-50">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
              <Link href="/" className="font-semibold text-sm sm:text-base md:text-lg text-white whitespace-nowrap truncate flex-shrink-0">
                <span className="text-green-300">R</span><span>oyaltyMeds</span>
              </Link>
              <div className="hidden lg:flex space-x-1">
                <Link
                  href="/"
                  className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-green-100 hover:text-white hover:bg-green-700"
                >
                  Home
                </Link>
                <OrdersButton />
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              <Link
                href="/patient/home"
                className="px-3 py-2 rounded-md text-sm font-medium text-green-100 hover:text-white hover:bg-green-700 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <CartButtonWithBadge />
            </div>

            {/* Mobile: Cart icon, dashboard, and sidebar */}
            <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
              <Link
                href="/patient/home"
                className="p-2 rounded-md text-green-100 hover:text-white hover:bg-green-700"
                title="Dashboard"
              >
                <LayoutDashboard className="w-5 h-5" />
              </Link>
              <MobileCartIconButton />
              <StoreMobileSidebar />
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
