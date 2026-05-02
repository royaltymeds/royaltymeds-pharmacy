-- Restock notification configuration per pharmacist/admin user
CREATE TABLE IF NOT EXISTS public.restock_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  whatsapp_target_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT restock_notification_settings_user_id_key UNIQUE (user_id)
);

ALTER TABLE public.restock_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restock_notification_settings_select" ON public.restock_notification_settings FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'doctor')));

CREATE POLICY "restock_notification_settings_insert" ON public.restock_notification_settings FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'doctor')));

CREATE POLICY "restock_notification_settings_update" ON public.restock_notification_settings FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'doctor')))
WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'doctor')));

CREATE OR REPLACE FUNCTION public.update_restock_notification_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restock_notification_settings_updated_at ON public.restock_notification_settings;
CREATE TRIGGER trg_restock_notification_settings_updated_at
BEFORE UPDATE ON public.restock_notification_settings
FOR EACH ROW EXECUTE FUNCTION public.update_restock_notification_settings_updated_at();
