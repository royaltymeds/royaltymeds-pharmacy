-- Migration: Enhance address fields with street, city, state, country, postal code
-- Date: 2026-02-12
-- Purpose: Properly structure address data by breaking it into components

-- 1. Enhance user_profiles table
ALTER TABLE public.user_profiles
DROP COLUMN IF EXISTS address;
-- Note: city, state, zip already exist - we'll add country and rename/restructure

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS street_address_line_1 TEXT,
ADD COLUMN IF NOT EXISTS street_address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Jamaica',
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- 2. Enhance orders table - shipping address
ALTER TABLE public.orders
DROP COLUMN IF EXISTS shipping_address,
DROP COLUMN IF EXISTS billing_address;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_street_line_1 TEXT,
ADD COLUMN IF NOT EXISTS shipping_street_line_2 TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_state TEXT,
ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_country TEXT DEFAULT 'Jamaica',
ADD COLUMN IF NOT EXISTS billing_street_line_1 TEXT,
ADD COLUMN IF NOT EXISTS billing_street_line_2 TEXT,
ADD COLUMN IF NOT EXISTS billing_city TEXT,
ADD COLUMN IF NOT EXISTS billing_state TEXT,
ADD COLUMN IF NOT EXISTS billing_postal_code TEXT,
ADD COLUMN IF NOT EXISTS billing_country TEXT DEFAULT 'Jamaica';

-- 3. Enhance prescriptions table
ALTER TABLE public.prescriptions
DROP COLUMN IF EXISTS practice_address;

ALTER TABLE public.prescriptions
ADD COLUMN IF NOT EXISTS practice_street_line_1 TEXT,
ADD COLUMN IF NOT EXISTS practice_street_line_2 TEXT,
ADD COLUMN IF NOT EXISTS practice_city TEXT,
ADD COLUMN IF NOT EXISTS practice_state TEXT,
ADD COLUMN IF NOT EXISTS practice_postal_code TEXT,
ADD COLUMN IF NOT EXISTS practice_country TEXT DEFAULT 'Jamaica';

-- 4. Enhance doctor_prescriptions table
ALTER TABLE public.doctor_prescriptions
DROP COLUMN IF EXISTS practice_address;

ALTER TABLE public.doctor_prescriptions
ADD COLUMN IF NOT EXISTS practice_street_line_1 TEXT,
ADD COLUMN IF NOT EXISTS practice_street_line_2 TEXT,
ADD COLUMN IF NOT EXISTS practice_city TEXT,
ADD COLUMN IF NOT EXISTS practice_state TEXT,
ADD COLUMN IF NOT EXISTS practice_postal_code TEXT,
ADD COLUMN IF NOT EXISTS practice_country TEXT DEFAULT 'Jamaica';

-- Update column comments for clarity
COMMENT ON COLUMN public.user_profiles.street_address_line_1 IS 'Primary street address (required)';
COMMENT ON COLUMN public.user_profiles.street_address_line_2 IS 'Secondary street address (optional - apartment, suite, etc.)';
COMMENT ON COLUMN public.user_profiles.city IS 'City or parish';
COMMENT ON COLUMN public.user_profiles.state IS 'State or province';
COMMENT ON COLUMN public.user_profiles.country IS 'Country (defaults to Jamaica)';
COMMENT ON COLUMN public.user_profiles.postal_code IS 'Postal/ZIP code';

COMMENT ON COLUMN public.orders.shipping_street_line_1 IS 'Shipping address street (required)';
COMMENT ON COLUMN public.orders.shipping_street_line_2 IS 'Shipping address secondary line (optional)';
COMMENT ON COLUMN public.orders.billing_street_line_1 IS 'Billing address street (required)';
COMMENT ON COLUMN public.orders.billing_street_line_2 IS 'Billing address secondary line (optional)';

COMMENT ON COLUMN public.prescriptions.practice_street_line_1 IS 'Doctor practice street address';
COMMENT ON COLUMN public.prescriptions.practice_street_line_2 IS 'Doctor practice secondary address line';

COMMENT ON COLUMN public.doctor_prescriptions.practice_street_line_1 IS 'Doctor practice street address';
COMMENT ON COLUMN public.doctor_prescriptions.practice_street_line_2 IS 'Doctor practice secondary address line';
