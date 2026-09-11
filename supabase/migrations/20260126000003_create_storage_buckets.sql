-- Create instrument-images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('instrument-images', 'instrument-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create maintenance-documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance-documents', 'maintenance-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access for reading from public buckets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('instrument-images', 'maintenance-documents'));

-- Allow authenticated users to upload and modify
CREATE POLICY "Auth Users Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('instrument-images', 'maintenance-documents'));
CREATE POLICY "Auth Users Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('instrument-images', 'maintenance-documents'));
CREATE POLICY "Auth Users Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('instrument-images', 'maintenance-documents'));
