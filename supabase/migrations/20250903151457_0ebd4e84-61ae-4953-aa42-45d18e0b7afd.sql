-- Remove public access policy for invoice items
DROP POLICY IF EXISTS "Allow public access to invoice items for invoice display" ON public.invoice_items;

-- Ensure service role can still access invoice items for public invoice display  
-- (Service roles already bypass RLS, but this is explicit documentation)