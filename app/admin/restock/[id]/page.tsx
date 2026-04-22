import { redirect } from 'next/navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { RestockRequestDetail } from '@/components/admin/restock/restock-request-detail';

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

export default async function RestockRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getAuthUser();
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/restock"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Restock Order Details</h1>
      </div>

      <RestockRequestDetail requestId={id} />
    </div>
  );
}
