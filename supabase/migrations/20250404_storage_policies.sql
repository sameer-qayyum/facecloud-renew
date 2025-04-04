-- Migration for Storage Bucket RLS Policies
-- Created: 2025-04-04

-- First, create the bucket if it doesn't exist and ensure it's public
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Company owners can upload clinic assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view clinic assets" ON storage.objects;
DROP POLICY IF EXISTS "Clinic staff can view clinic assets" ON storage.objects;
DROP POLICY IF EXISTS "Temporary - Anyone can upload clinic assets" ON storage.objects;
DROP POLICY IF EXISTS "Temporary - Anyone can update clinic assets" ON storage.objects;

-- Create a simple policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload to clinic-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clinic-assets' AND auth.role() = 'authenticated');

-- Create a simple policy for authenticated users to update
CREATE POLICY "Authenticated users can update clinic-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clinic-assets' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'clinic-assets' AND auth.role() = 'authenticated');

-- Create a simple policy for authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete from clinic-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'clinic-assets' AND auth.role() = 'authenticated');

-- Create a simple policy for anyone to read from public bucket
CREATE POLICY "Anyone can view clinic-assets" 
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-assets');

-- Revalidate all policies for the bucket
SELECT storage.refresh_auth('clinic-assets');
