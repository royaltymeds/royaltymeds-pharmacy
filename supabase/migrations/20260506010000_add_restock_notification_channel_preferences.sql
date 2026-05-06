-- Ensure restock notification channel preference columns exist in deployed databases.
-- Some environments may have only applied the email-recipient migration, so the
-- application must be able to persist the notification page preferences too.
ALTER TABLE public.restock_notification_settings
  ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS app_toast_notifications_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_notifications_enabled boolean NOT NULL DEFAULT false;

-- Prompt PostgREST/Supabase to refresh the schema cache after adding columns.
NOTIFY pgrst, 'reload schema';
