
-- Add template_id column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN template_id integer;
