
-- Add missing terms column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS terms TEXT;
