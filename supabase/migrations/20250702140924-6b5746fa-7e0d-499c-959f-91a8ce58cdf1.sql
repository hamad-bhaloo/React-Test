-- Add admin access policies for profiles table
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add admin access policies for invoices table  
CREATE POLICY "Admins can view all invoices"
ON public.invoices
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add admin access policies for companies table
CREATE POLICY "Admins can view all companies"
ON public.companies
FOR SELECT 
TO authenticated  
USING (has_role(auth.uid(), 'admin'));

-- Add admin access policies for clients table
CREATE POLICY "Admins can view all clients"
ON public.clients
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));