import { redirect } from 'next/navigation';
import { getRestockNotificationSettings } from '@/app/actions/restock';
import { NotificationsSettingsClient } from './notifications-settings-client';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

async function getAuthUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/admin-login');
  }

  return user;
}

export default async function AdminNotificationsPage() {
  const user = await getAuthUser();
  const { data: initialSettings } = await getRestockNotificationSettings(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-2 text-gray-600">
          Configure restock notification recipients and channel preferences for admin workflows.
        </p>
      </div>

      <NotificationsSettingsClient userId={user.id} initialSettings={initialSettings} />
    </div>
  );
}
