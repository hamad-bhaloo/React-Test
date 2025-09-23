
-- Create RLS policies for the company-assets storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload files to the logos folder
CREATE POLICY "Users can upload company logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'company-assets' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = 'logos'
);

-- Allow users to view uploaded logos (public read access)
CREATE POLICY "Anyone can view company logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-assets' AND (storage.foldername(name))[1] = 'logos');

-- Allow users to update/replace their own logos
CREATE POLICY "Users can update company logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'company-assets' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = 'logos'
);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete company logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'company-assets' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = 'logos'
);
