import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NewRestockRequestForm } from '@/components/admin/restock/new-restock-request-form';

export const dynamic = 'force-dynamic';

async function getAuthUser() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/admin-login');
  }

  return user;
}

export default async function NewRestockRequestPage() {
  const user = await getAuthUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Restock Order</h1>
        <p className="text-gray-600 mt-2">Create and submit a restock order to a supplier</p>
      </div>

      <NewRestockRequestForm pharmacistId={user.id} />
    </div>
  );
}
