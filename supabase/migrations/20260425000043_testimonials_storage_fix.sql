-- Fix storage RLS for testimonials photos
-- Problem: original migration had INSERT + DELETE but no UPDATE policy.
-- upsert:true triggers UPDATE when file exists → RLS violation.

-- Drop old conflicting policies
DROP POLICY IF EXISTS "testimonials_photos_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "testimonials_photos_admin_write"   ON storage.objects;
DROP POLICY IF EXISTS "testimonials_photos_admin_delete"  ON storage.objects;
DROP POLICY IF EXISTS "Public read testimonials photos"   ON storage.objects;
DROP POLICY IF EXISTS "Owner upload testimonials photos"  ON storage.objects;
DROP POLICY IF EXISTS "Owner update testimonials photos"  ON storage.objects;

-- Ensure bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public SELECT (anyone can view photos)
CREATE POLICY "testimonials_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'testimonials');

-- Authenticated INSERT
CREATE POLICY "testimonials_photos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'testimonials');

-- Authenticated UPDATE (needed for upsert)
CREATE POLICY "testimonials_photos_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'testimonials');

-- Authenticated DELETE
CREATE POLICY "testimonials_photos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'testimonials');
