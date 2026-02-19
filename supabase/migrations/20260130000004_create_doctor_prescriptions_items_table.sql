-- Create doctor_prescriptions_items table for medications in doctor prescriptions
CREATE TABLE public.doctor_prescriptions_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_prescription_id uuid NOT NULL,
  medication_name text NOT NULL,
  dosage text,
  quantity integer,
  brand_choice text DEFAULT 'generic'::text CHECK (brand_choice = ANY (ARRAY['brand'::text, 'generic'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT doctor_prescriptions_items_pkey PRIMARY KEY (id),
  CONSTRAINT doctor_prescriptions_items_doctor_prescription_id_fkey FOREIGN KEY (doctor_prescription_id) REFERENCES public.doctor_prescriptions(id) ON DELETE CASCADE
);

-- Create index on doctor_prescription_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_items_doctor_prescription_id ON public.doctor_prescriptions_items(doctor_prescription_id);
