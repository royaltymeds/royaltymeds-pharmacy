import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { Plus, Package } from 'lucide-react';
/*import { RestockDashboard } from '@/components/admin/restock/restock-dashboard';*/
import { RestockWorkflowTabs } from '@/components/admin/restock/restock-workflow-tabs';

export const dynamic = 'force-dynamic';

async function getAuthUser() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/admin-login');
  }

  return user;
}

export default async function RestockPage() {
  const user = await getAuthUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restock Management</h1>
          <p className="text-gray-600 mt-2">
            Manage supplier request queues, scheduled re-orders, purchase orders, and receiving in one connected workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/restock/suppliers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            <Package className="w-4 h-4" />
            Manage Suppliers
          </Link>
          <Link
            href="/admin/restock/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            New Restock Order
          </Link>
        </div>
      </div>

      {/* <RestockDashboard /> */}

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900">Purchase-order driven workflow</h3>
        <p className="mt-1 text-sm text-blue-700">
          Restock requests no longer require approval. Requests queue under each supplier, are added to open supplier purchase orders automatically, and are received from the purchase order.
        </p>
      </div>

      <div id="purchase-order-workflow">
        <RestockWorkflowTabs userId={user.id} />
      </div>
    </div>
  );
}
