-- Add the only missing foreign key
ALTER TABLE public.admin_feedback
ADD CONSTRAINT admin_feedback_admin_id_fkey
FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE CASCADE;