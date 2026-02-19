-- Drop existing RLS policies
DROP POLICY IF EXISTS "Doctors can view their own prescription items" ON public.doctor_prescriptions_items;
DROP POLICY IF EXISTS "Doctors can insert their own prescription items" ON public.doctor_prescriptions_items;
DROP POLICY IF EXISTS "Doctors can update their own prescription items" ON public.doctor_prescriptions_items;
DROP POLICY IF EXISTS "Doctors can delete their own prescription items" ON public.doctor_prescriptions_items;
DROP POLICY IF EXISTS "Admins can view all prescription items" ON public.doctor_prescriptions_items;
DROP POLICY IF EXISTS "Admins can insert all prescription items" ON public.doctor_prescriptions_items;
DROP POLICY IF EXISTS "Admins can update all prescription items" ON public.doctor_prescriptions_items;
DROP POLICY IF EXISTS "Admins can delete all prescription items" ON public.doctor_prescriptions_items;

-- Optimized SELECT policy: Doctors can view their own, Admins can view all
CREATE POLICY "view_doctor_prescriptions_items"
ON public.doctor_prescriptions_items
FOR SELECT
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM public.doctor_prescriptions dp
      WHERE dp.id = doctor_prescriptions_items.doctor_prescription_id
      AND dp.doctor_id = (SELECT auth.uid())
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  )
);

-- Optimized INSERT policy: Doctors can insert their own, Admins can insert all
CREATE POLICY "insert_doctor_prescriptions_items"
ON public.doctor_prescriptions_items
FOR INSERT
TO authenticated
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.doctor_prescriptions dp
      WHERE dp.id = doctor_prescriptions_items.doctor_prescription_id
      AND dp.doctor_id = (SELECT auth.uid())
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  )
);

-- Optimized UPDATE policy: Doctors can update their own, Admins can update all
CREATE POLICY "update_doctor_prescriptions_items"
ON public.doctor_prescriptions_items
FOR UPDATE
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM public.doctor_prescriptions dp
      WHERE dp.id = doctor_prescriptions_items.doctor_prescription_id
      AND dp.doctor_id = (SELECT auth.uid())
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  )
)
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.doctor_prescriptions dp
      WHERE dp.id = doctor_prescriptions_items.doctor_prescription_id
      AND dp.doctor_id = (SELECT auth.uid())
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  )
);

-- Optimized DELETE policy: Doctors can delete their own, Admins can delete all
CREATE POLICY "delete_doctor_prescriptions_items"
ON public.doctor_prescriptions_items
FOR DELETE
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM public.doctor_prescriptions dp
      WHERE dp.id = doctor_prescriptions_items.doctor_prescription_id
      AND dp.doctor_id = (SELECT auth.uid())
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  )
);
