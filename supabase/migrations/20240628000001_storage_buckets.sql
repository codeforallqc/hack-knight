INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Service role full access photos" ON storage.objects
  USING (bucket_id = 'photos' AND auth.role() = 'service_role');
