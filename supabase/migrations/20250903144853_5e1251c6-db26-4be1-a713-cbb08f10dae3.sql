-- Remove the insecure public payment creation policy
DROP POLICY IF EXISTS "Allow public payment recording for invoices" ON public.payments;

-- Payments should only be created through authenticated channels:
-- 1. Users can create payments for invoices they own
-- 2. Edge functions with service role can create payments (for Stripe webhooks, etc.)
-- 3. Admins can create payments for any invoice

-- Add secure policy for users to create payments only for their own invoices
CREATE POLICY "Users can create payments for own invoices" ON public.payments
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = payments.invoice_id 
    AND invoices.user_id = auth.uid()
  )
);

-- Add policy for service role (edge functions) to create payments
CREATE POLICY "Service role can create payments" ON public.payments
FOR INSERT 
WITH CHECK (
  current_setting('role') = 'service_role'
);

-- Existing policies remain secure:
-- 1. "Users can view their own payments" 
-- 2. "Users can update their own payments"
-- 3. "Users can delete their own payments"
-- 4. "Users can insert their own payments" (for authenticated users with their invoices)