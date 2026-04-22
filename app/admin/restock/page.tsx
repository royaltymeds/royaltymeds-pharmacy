import { redirect } from 'next/navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Plus, Package, AlertCircle } from 'lucide-react';
import { RestockDashboard } from '@/components/admin/restock/restock-dashboard';
import { RestockRequestsList } from '@/components/admin/restock/restock-requests-list';

export const dynamic = 'force-dynamic';

async function getAuthUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/admin-login');
  }

  // Check user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') {
    redirect('/');
  }

  return user;
}

export default async function RestockPage() {
  await getAuthUser();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restock Management</h1>
          <p className="text-gray-600 mt-2">
            Manage suppliers and submit restock orders for inventory replenishment
          </p>
        </div>
        <div className="flex gap-3">
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

      {/* Dashboard Stats */}
      <RestockDashboard />

      {/* Pending Requests Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900">Pending Approval</h3>
          <p className="text-sm text-blue-700">
            Check the list below for restock orders awaiting approval
          </p>
        </div>
      </div>

      {/* Restock Requests List */}
      <RestockRequestsList />
    </div>
  );
}
