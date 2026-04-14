
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true);

CREATE POLICY "Authenticated users can upload post media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "Anyone can read post media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'post-media');

CREATE POLICY "Users can delete own post media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);
