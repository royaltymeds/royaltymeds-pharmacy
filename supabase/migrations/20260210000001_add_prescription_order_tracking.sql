-- Add prescription order tracking to orders table
-- This migration enables creating orders from prescriptions with proper tracking

-- Add columns to track prescription origin
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS is_prescription_order boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS doctor_prescription_id uuid REFERENCES public.doctor_prescriptions(id) ON DELETE SET NULL;

-- Create index for efficient lookup of prescription orders
CREATE INDEX IF NOT EXISTS idx_orders_prescription_id ON public.orders(prescription_id) WHERE is_prescription_order = true;
CREATE INDEX IF NOT EXISTS idx_orders_doctor_prescription_id ON public.orders(doctor_prescription_id) WHERE is_prescription_order = true;

-- Comment on columns for documentation
COMMENT ON COLUMN public.orders.is_prescription_order IS 'Indicates if this order was created from a prescription';
COMMENT ON COLUMN public.orders.prescription_id IS 'References the patient prescription if created from one';
COMMENT ON COLUMN public.orders.doctor_prescription_id IS 'References the doctor prescription if created from one';
