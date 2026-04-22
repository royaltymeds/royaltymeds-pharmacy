import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { SuppliersList } from '@/components/admin/restock/suppliers-list';

export const dynamic = 'force-dynamic';

async function getAuthUser() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/admin-login');
  }

  return user;
}

export default async function SuppliersPage() {
  await getAuthUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/restock" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Suppliers</h1>
          <p className="text-gray-600 mt-1">
            Add, edit, and manage suppliers for restock orders
          </p>
        </div>
      </div>

      <SuppliersList />
    </div>
  );
}
