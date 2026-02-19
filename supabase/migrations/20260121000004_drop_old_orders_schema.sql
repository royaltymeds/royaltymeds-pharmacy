-- Drop tables dependent on the old orders table
-- This migration replaces the old prescription-based orders system
-- with the new e-commerce OTC orders system

-- Drop dependent tables first (in reverse dependency order)
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
