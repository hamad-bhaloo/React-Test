
-- Add new columns to the clients table to support organizational and individual clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'individual' CHECK (client_type IN ('individual', 'organizational')),
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS tax_number text,
ADD COLUMN IF NOT EXISTS registration_number text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS contact_person_email text,
ADD COLUMN IF NOT EXISTS contact_person_phone text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS linkedin_profile text,
ADD COLUMN IF NOT EXISTS twitter_profile text,
ADD COLUMN IF NOT EXISTS facebook_profile text,
ADD COLUMN IF NOT EXISTS instagram_profile text;

-- Update the name column to be nullable since we'll use first_name/last_name for individuals
ALTER TABLE public.clients ALTER COLUMN name DROP NOT NULL;
