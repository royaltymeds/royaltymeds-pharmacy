'use client';

import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { AlertCircle, Bell, Check, Loader, Mail, MessageSquare, Monitor, Smartphone } from 'lucide-react';
import {
  getRestockNotificationSettings,
  upsertRestockNotificationSettings,
} from '@/app/actions/restock';
import { RestockNotificationSettings, UpdateRestockNotificationSettingsInput } from '@/lib/types/restock';

const defaultSettings: UpdateRestockNotificationSettingsInput = {
  notification_email: '',
  whatsapp_notifications_enabled: false,
  sms_notifications_enabled: false,
  app_toast_notifications_enabled: true,
  push_notifications_enabled: false,
};

interface NotificationsSettingsClientProps {
  userId: string;
  initialSettings: RestockNotificationSettings | null;
}

function toFormState(settings: RestockNotificationSettings | null): UpdateRestockNotificationSettingsInput {
  return {
    notification_email: settings?.notification_email || defaultSettings.notification_email,
    whatsapp_notifications_enabled:
      settings?.whatsapp_notifications_enabled ?? defaultSettings.whatsapp_notifications_enabled,
    sms_notifications_enabled: settings?.sms_notifications_enabled ?? defaultSettings.sms_notifications_enabled,
    app_toast_notifications_enabled:
      settings?.app_toast_notifications_enabled ?? defaultSettings.app_toast_notifications_enabled,
    push_notifications_enabled: settings?.push_notifications_enabled ?? defaultSettings.push_notifications_enabled,
  };
}

interface ToggleRowProps {
  id: keyof Omit<UpdateRestockNotificationSettingsInput, 'notification_email'>;
  title: string;
  description: string;
  icon: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (id: ToggleRowProps['id'], checked: boolean) => void;
}

function ToggleRow({ id, title, description, icon, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
      <div className="flex gap-3">
        <div className="mt-0.5 rounded-full bg-green-50 p-2 text-green-700">{icon}</div>
        <div>
          <label htmlFor={id} className="font-medium text-gray-900">
            {title}
          </label>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(id, !checked)}
        className={`relative mt-1 inline-flex h-6 w-11 flex-shrink-0 rounded-full transition ${
          checked ? 'bg-green-600' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationsSettingsClient({ userId, initialSettings }: NotificationsSettingsClientProps) {
  const [formData, setFormData] = useState(() => toFormState(initialSettings));
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const whatsappOrSmsEnabled = useMemo(
    () => formData.whatsapp_notifications_enabled || formData.sms_notifications_enabled,
    [formData.sms_notifications_enabled, formData.whatsapp_notifications_enabled]
  );

  const handleToggle = (
    id: keyof Omit<UpdateRestockNotificationSettingsInput, 'notification_email'>,
    checked: boolean
  ) => {
    setFormData((current) => ({ ...current, [id]: checked }));
    setSuccess(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setSuccess(null);

    const { data, error: refreshError } = await getRestockNotificationSettings(userId);
    if (refreshError) {
      setError(refreshError);
    } else {
      setFormData(toFormState(data));
      setSuccess('Notification settings refreshed.');
    }

    setRefreshing(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error: saveError } = await upsertRestockNotificationSettings(userId, {
      ...formData,
      notification_email: formData.notification_email.trim(),
    });

    if (saveError) {
      setError(saveError);
      setLoading(false);
      return;
    }

    setSuccess('Notification settings saved successfully.');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Unable to save notification settings</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-700" />
          <p className="font-medium text-green-800">{success}</p>
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-full bg-green-50 p-2 text-green-700">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Restock notifications</h2>
            <p className="mt-1 text-sm text-gray-600">
              These settings control who is notified when a restock order is submitted and which notification
              channels are enabled for restock workflows.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="notification_email" className="mb-2 block text-sm font-medium text-gray-700">
              Preferred restock notification email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="notification_email"
                type="email"
                value={formData.notification_email}
                onChange={(event) => {
                  setFormData((current) => ({ ...current, notification_email: event.target.value }));
                  setSuccess(null);
                }}
                placeholder="restock-alerts@example.com"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Restock submission emails are sent to this address via the configured Gmail SMTP credentials.
            </p>
          </div>

          <ToggleRow
            id="whatsapp_notifications_enabled"
            title="WhatsApp notifications"
            description="Reserve this preference for the future WhatsApp restock notification implementation."
            icon={<MessageSquare className="h-4 w-4" />}
            checked={formData.whatsapp_notifications_enabled}
            onChange={handleToggle}
          />
          <ToggleRow
            id="sms_notifications_enabled"
            title="SMS notifications"
            description="Reserve this preference for the future SMS restock notification implementation."
            icon={<Smartphone className="h-4 w-4" />}
            checked={formData.sms_notifications_enabled}
            onChange={handleToggle}
          />
          <ToggleRow
            id="app_toast_notifications_enabled"
            title="In-app toast notifications"
            description="Show app toast notifications for restock workflow events where supported."
            icon={<Monitor className="h-4 w-4" />}
            checked={formData.app_toast_notifications_enabled}
            onChange={handleToggle}
          />
          <ToggleRow
            id="push_notifications_enabled"
            title="Push notifications"
            description="Allow browser/device push notifications for future restock notification delivery."
            icon={<Bell className="h-4 w-4" />}
            checked={formData.push_notifications_enabled}
            onChange={handleToggle}
          />
        </div>

        {whatsappOrSmsEnabled && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            WhatsApp and SMS are saved as preferences only; delivery integrations will be added later.
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:bg-gray-300"
        >
          {loading && <Loader className="h-4 w-4 animate-spin" />}
          Save notification settings
        </button>
        <button
          type="button"
          disabled={refreshing || loading}
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {refreshing && <Loader className="h-4 w-4 animate-spin" />}
          Refresh settings
        </button>
      </div>
    </form>
  );
}
