-- Add deadline and feedback columns to complaints table
ALTER TABLE public.complaints
ADD COLUMN deadline timestamp with time zone,
ADD COLUMN feedback text;

-- Create admin_feedback table for tracking feedback history
CREATE TABLE public.admin_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  feedback text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_feedback
ALTER TABLE public.admin_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_feedback
CREATE POLICY "Users can view feedback for their complaints"
ON public.admin_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = admin_feedback.complaint_id
    AND (c.student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Only admins can create feedback"
ON public.admin_feedback
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update complaints policies to allow admins to set deadlines
CREATE POLICY "Admins can view all complaints"
ON public.complaints
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment to deadline column
COMMENT ON COLUMN public.complaints.deadline IS 'Expected resolution deadline set by admin';