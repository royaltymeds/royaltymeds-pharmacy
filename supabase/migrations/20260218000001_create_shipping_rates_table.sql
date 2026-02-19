-- Create shipping_rates table for location-based shipping configuration
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parish character varying NOT NULL,
  city_town character varying,
  rate numeric NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shipping_rates_pkey PRIMARY KEY (id),
  CONSTRAINT shipping_rates_unique_location UNIQUE (parish, city_town)
);

-- Add default_shipping_cost to payment_config if it doesn't exist
ALTER TABLE public.payment_config
ADD COLUMN IF NOT EXISTS default_shipping_cost numeric DEFAULT 0;

-- Create index on parish and city_town for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipping_rates_parish_city ON public.shipping_rates (parish, city_town);

-- Create index on is_default for quickly finding default rates
CREATE INDEX IF NOT EXISTS idx_shipping_rates_is_default ON public.shipping_rates (is_default);

-- Enable RLS on shipping_rates table
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can create shipping rates
CREATE POLICY "admins_create_rates" ON public.shipping_rates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Admins can update shipping rates
CREATE POLICY "admins_update_rates" ON public.shipping_rates
  FOR UPDATE
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Admins can delete shipping rates
CREATE POLICY "admins_delete_rates" ON public.shipping_rates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Public (authenticated users) can view shipping rates
CREATE POLICY "public_select_rates" ON public.shipping_rates
  FOR SELECT
  USING (true);
