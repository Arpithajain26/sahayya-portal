-- Enable realtime for complaints table
ALTER TABLE public.complaints REPLICA IDENTITY FULL;

-- Add the complaints table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;