-- Add unit column to invoice_items to support public invoice display and PDFs
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'pcs';

-- Optional: ensure future inserts without explicit unit still default correctly
ALTER TABLE public.invoice_items
  ALTER COLUMN unit SET DEFAULT 'pcs';