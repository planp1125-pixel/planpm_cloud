-- Storage policies for Supabase
DROP POLICY IF EXISTS "allow_public_read" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_delete" ON storage.objects;

CREATE POLICY "allow_public_read" ON storage.objects FOR SELECT TO public USING (true);
CREATE POLICY "allow_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "allow_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (true);
