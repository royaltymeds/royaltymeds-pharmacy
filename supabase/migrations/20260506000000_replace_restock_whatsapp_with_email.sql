-- Replace restock WhatsApp notification configuration with email notification configuration.
ALTER TABLE public.restock_notification_settings
  ADD COLUMN IF NOT EXISTS notification_email text;

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
