
CREATE POLICY "chat_media_read_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-media');

CREATE POLICY "chat_media_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "chat_media_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);
