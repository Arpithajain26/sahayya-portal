-- Add DELETE policies for complaints table

-- Students can delete their own complaints
CREATE POLICY "Students can delete own complaints"
ON public.complaints
FOR DELETE
USING (student_id = auth.uid());

-- Admins can delete all complaints
CREATE POLICY "Admins can delete all complaints"
ON public.complaints
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));