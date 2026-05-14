import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const adminSections = [
  { href: "/admin/dashboard", title: "Dashboard", description: "Return to the pharmacy operations overview and recent work queues." },
  { href: "/admin/restock", title: "Restock Management", description: "Manage supplier queues, purchase orders, receiving, schedules, and supplier products." },
  { href: "/admin/restock/suppliers", title: "Suppliers", description: "Maintain supplier profiles, linked products, pricing, schedules, and bulk item uploads." },
  { href: "/admin/prescriptions", title: "Prescriptions", description: "Review patient and doctor-submitted prescriptions before fulfillment." },
  { href: "/admin/orders", title: "Orders", description: "Track customer orders, payment status, fulfillment, and delivery." },
  { href: "/admin/refills", title: "Refill Requests", description: "Review pending refill requests and patient refill history." },
  { href: "/admin/inventory", title: "Inventory", description: "Maintain OTC and prescription catalog items, stock status, and pricing." },
  { href: "/admin/payments", title: "Payment Settings", description: "Configure pharmacy payment instructions, tax, shipping, and card/bank transfer options." },
  { href: "/admin/transactions", title: "Transactions", description: "Review patient payments and transaction history." },
  { href: "/admin/notifications", title: "Notifications", description: "Configure operational notification and restock alert preferences." },
  { href: "/admin/email-templates", title: "Email Templates", description: "Edit notification email copy used across pharmacy workflows." },
  { href: "/admin/users", title: "Users", description: "Administer patient, doctor, pharmacist, and administrative user accounts." },
  { href: "/admin/doctors", title: "Doctors", description: "Manage doctor records and doctor-specific patient relationships." },
  { href: "/admin/patient-links", title: "Patient Links", description: "Review and maintain doctor-to-patient authorization links." },
  { href: "/admin/audit-logs", title: "Audit Logs", description: "Inspect administrative activity and security-relevant event history." },
];

export default async function MoreAdminToolsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-l-4 border-green-600 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Admin navigation</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">More Admin Tools</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 sm:text-base">
              Use this server-rendered directory to jump to every pharmacy administrative workspace without relying on hidden menus.
            </p>
          </div>
          <Link href="/admin/dashboard" className="text-sm font-semibold text-green-700 hover:text-green-800">
            ← Back to dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow-md">
            <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{section.description}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-green-700">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
