import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { RestockPageClient } from '@/components/admin/restock/restock-page-client';

export const dynamic = 'force-dynamic';

async function getAuthUser() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/admin-login');
  }

  return user;
}

export default async function RestockPage({ searchParams }: { searchParams?: Promise<{ newRestock?: string }> }) {
  const user = await getAuthUser();
  const params = await searchParams;

  return <RestockPageClient userId={user.id} initialOpenNewRestockModal={params?.newRestock === '1'} />;
}
