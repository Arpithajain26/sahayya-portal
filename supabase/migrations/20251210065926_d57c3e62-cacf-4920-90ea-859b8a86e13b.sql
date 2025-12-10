-- Create a storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', true);

-- Allow authenticated users to upload voice notes to their own folder
CREATE POLICY "Users can upload voice notes to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'voice-notes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view voice notes
CREATE POLICY "Anyone can view voice notes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'voice-notes');

-- Allow users to delete their own voice notes
CREATE POLICY "Users can delete own voice notes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'voice-notes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);