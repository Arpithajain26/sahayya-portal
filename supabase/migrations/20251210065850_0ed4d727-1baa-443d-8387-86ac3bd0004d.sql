-- Add voice_note_url column to complaints table for voice recordings
ALTER TABLE public.complaints 
ADD COLUMN voice_note_url TEXT;

-- Add a comment explaining the column
COMMENT ON COLUMN public.complaints.voice_note_url IS 'URL to the voice recording (up to 3 minutes) attached to the complaint';