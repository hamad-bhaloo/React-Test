-- Remove the insecure public access policy from companies table
DROP POLICY IF EXISTS "Allow public access to companies for invoice display" ON public.companies;

-- The companies table should only be accessible to:
-- 1. Users viewing their own companies  
-- 2. Admins viewing all companies
-- 3. Company data for invoice display will be handled via edge function with service role

-- Verify existing secure policies are still in place:
-- 1. "Users can view own companies" - allows user_id = auth.uid()  
-- 2. "Admins can view all companies" - allows has_role(auth.uid(), 'admin'::app_role)
-- 3. Other CRUD policies for users managing their own companies

-- No changes needed to other policies as they are properly secured