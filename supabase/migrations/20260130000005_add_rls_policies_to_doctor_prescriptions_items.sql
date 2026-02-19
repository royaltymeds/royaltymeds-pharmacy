-- Enable RLS on doctor_prescriptions_items
ALTER TABLE public.doctor_prescriptions_items ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can view their own prescription items
CREATE POLICY "Doctors can view their own prescription items"
ON public.doctor_prescriptions_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctor_prescriptions dp
    WHERE dp.id = doctor_prescriptions_items.doctor_prescription_id
    AND dp.doctor_id = auth.uid()
  )
);

-- Policy: Doctors can insert their own prescription items
CREATE POLICY "Doctors can insert their own prescription items"
ON public.doctor_prescriptions_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.doctor_prescriptions dp
    WHERE dp.id = doctor_prescriptions_items.doctor_prescription_id
    AND dp.doctor_id = auth.uid()
  )
);

-- Policy: Doctors can update their own prescription items
CREATE POLICY "Doctors can update their own prescription items"
ON public.doctor_prescriptions_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctor_prescriptions dp
    WHERE dp.id = doctor_prescriptions_items.doctor_prescription_id
    AND dp.doctor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.doctor_prescriptions dp
    WHERE dp.id = doctor_prescriptions_items.doctor_prescription_id
    AND dp.doctor_id = auth.uid()
  )
);

-- Policy: Doctors can delete their own prescription items
CREATE POLICY "Doctors can delete their own prescription items"
ON public.doctor_prescriptions_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctor_prescriptions dp
    WHERE dp.id = doctor_prescriptions_items.doctor_prescription_id
    AND dp.doctor_id = auth.uid()
  )
);

-- Policy: Admins can view all prescription items
CREATE POLICY "Admins can view all prescription items"
ON public.doctor_prescriptions_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- Policy: Admins can insert all prescription items
CREATE POLICY "Admins can insert all prescription items"
ON public.doctor_prescriptions_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- Policy: Admins can update all prescription items
CREATE POLICY "Admins can update all prescription items"
ON public.doctor_prescriptions_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- Policy: Admins can delete all prescription items
CREATE POLICY "Admins can delete all prescription items"
ON public.doctor_prescriptions_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);
