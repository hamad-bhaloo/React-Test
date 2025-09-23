-- Remove the dangerous public access policy that exposes all invoice data
DROP POLICY IF EXISTS "Allow public access to invoices via public links" ON public.invoices;

-- Create a secure policy that only allows access to specific invoices via the edge function
-- The edge function will use service role to access invoices after validating payment link tokens
CREATE POLICY "Service role can access invoices for public links" ON public.invoices
FOR SELECT 
USING (current_setting('role') = 'service_role');

-- Update the get-public-invoice edge function to require payment_link_id validation
-- This ensures only invoices with valid payment link tokens can be accessed publicly