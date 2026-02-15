-- Migration 6: Realtime
-- Enable realtime subscriptions for OKR-related tables

-- Enable realtime for OKR tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.okrs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.key_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.okr_checkins;
