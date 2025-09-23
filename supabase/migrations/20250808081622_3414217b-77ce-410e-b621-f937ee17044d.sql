-- Add currency column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN currency text DEFAULT 'USD';

-- Update existing expenses to use USD as default
UPDATE public.expenses 
SET currency = 'USD' 
WHERE currency IS NULL;