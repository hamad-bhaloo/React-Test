-- Remove the insecure public invoice update policy that allows anyone to modify invoices
DROP POLICY IF EXISTS "Allow public invoice updates for payments" ON public.invoices;

-- Invoices should only be updated through secure authenticated channels:
-- 1. Users can update their own invoices (existing policy)
-- 2. Edge functions with service role can update invoices for payment processing
-- 3. Admins can update any invoice

-- Add secure policy for service role (edge functions) to update invoices for payment processing
CREATE POLICY "Service role can update invoices for payments" ON public.invoices
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Existing secure policies remain:
-- 1. "Users can update own invoices" - allows user_id = auth.uid()
-- 2. "Users can update their own invoices" - allows user_id = auth.uid() 
-- 3. "Admins can view all invoices" - allows has_role(auth.uid(), 'admin'::app_role)
-- 4. Other user-specific CRUD policies

-- Payment processing will now be handled securely through:
-- 1. Stripe webhooks via edge functions with service role
-- 2. Manual payment recording by invoice owners
-- 3. Admin payment management