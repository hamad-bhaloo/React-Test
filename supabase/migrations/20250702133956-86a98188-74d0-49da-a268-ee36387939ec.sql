-- Add description column to companies table if missing
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS description TEXT;