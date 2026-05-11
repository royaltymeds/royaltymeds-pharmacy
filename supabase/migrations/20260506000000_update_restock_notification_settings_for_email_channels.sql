-- Store restock notification email recipients and channel preferences.
ALTER TABLE public.restock_notification_settings
  ADD COLUMN IF NOT EXISTS notification_email text,
  ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS app_toast_notifications_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_notifications_enabled boolean NOT NULL DEFAULT false;

-- Preserve any existing email-like values that may have been entered in the
-- legacy WhatsApp field before removing that workflow-specific column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'restock_notification_settings'
      AND column_name = 'whatsapp_target_number'
  ) THEN
    EXECUTE $update$
      UPDATE public.restock_notification_settings
      SET notification_email = whatsapp_target_number
      WHERE notification_email IS NULL
        AND whatsapp_target_number IS NOT NULL
        AND whatsapp_target_number LIKE '%@%'
    $update$;
  END IF;
END $$;

ALTER TABLE public.restock_notification_settings
  DROP COLUMN IF EXISTS whatsapp_target_number;
