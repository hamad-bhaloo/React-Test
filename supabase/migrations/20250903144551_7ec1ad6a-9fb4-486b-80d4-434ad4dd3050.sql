-- Remove the insecure public access policy from clients table
DROP POLICY IF EXISTS "Allow public access to clients for invoice display" ON public.clients;

-- The clients table should only be accessible to:
-- 1. Users viewing their own clients (auth.uid() = user_id)
-- 2. Admins viewing all clients (has_role function) 
-- 3. Client data for invoice display will be handled via edge function with service role

-- Verify existing secure policies remain in place:
-- 1. "Users can view own clients" - allows user_id = auth.uid()
-- 2. "Admins can view all clients" - allows has_role(auth.uid(), 'admin'::app_role) 
-- 3. Other CRUD policies for users managing their own clients

-- No changes needed to other policies as they are properly secured
-- The get-public-invoice edge function uses service role to access client data securely