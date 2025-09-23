-- Add RLS policy to allow public access to company information for invoices
CREATE POLICY "Allow public access to companies for invoice display" 
ON public.companies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.invoices 
    WHERE invoices.user_id = companies.user_id
  )
);