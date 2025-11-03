-- Add student feedback, rating, and resubmit tracking to complaints
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS student_feedback text,
ADD COLUMN IF NOT EXISTS student_rating integer CHECK (student_rating >= 1 AND student_rating <= 5),
ADD COLUMN IF NOT EXISTS resubmitted_from uuid REFERENCES public.complaints(id);

-- Update RLS policies to ensure students can only see their own complaints
DROP POLICY IF EXISTS "Students can view own complaints" ON public.complaints;
CREATE POLICY "Students can view own complaints" 
ON public.complaints 
FOR SELECT 
USING (student_id = auth.uid());

-- Allow students to update deadline, feedback, and rating on their own complaints
DROP POLICY IF EXISTS "Students can update own unresolved complaints" ON public.complaints;
CREATE POLICY "Students can update own complaints feedback and deadline" 
ON public.complaints 
FOR UPDATE 
USING (student_id = auth.uid());

-- Admins can still view and update all complaints
-- (These policies already exist, just ensuring they're correct)