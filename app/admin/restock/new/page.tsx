import { redirect } from 'next/navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NewRestockRequestForm } from '@/components/admin/restock/new-restock-request-form';

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
