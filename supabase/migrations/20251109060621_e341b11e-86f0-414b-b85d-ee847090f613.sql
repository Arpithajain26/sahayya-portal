-- Drop existing foreign keys that point to auth.users
ALTER TABLE public.complaints
DROP CONSTRAINT IF EXISTS complaints_student_id_fkey;

ALTER TABLE public.complaints
DROP CONSTRAINT IF EXISTS complaints_assigned_to_fkey;

-- Create new foreign keys pointing to profiles table
ALTER TABLE public.complaints
ADD CONSTRAINT complaints_student_id_fkey
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.complaints
ADD CONSTRAINT complaints_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;