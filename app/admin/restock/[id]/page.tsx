import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { RestockRequestDetail } from '@/components/admin/restock/restock-request-detail';

export const dynamic = 'force-dynamic';

async function getAuthUser() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/admin-login');
  }

  return user;
}

export default async function RestockRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthUser();
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

      <RestockRequestDetail requestId={id} userId={user.id} />
    </div>
  );
}
