
-- Create a policy to allow public access to invoices via their public links
-- This will allow the public invoice page to work without authentication
CREATE POLICY "Allow public access to invoices via public links" 
ON public.invoices 
FOR SELECT 
USING (true);

-- Also allow public access to related data needed for invoice display
CREATE POLICY "Allow public access to clients for invoice display" 
ON public.clients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.client_id = clients.id
  )
);

CREATE POLICY "Allow public access to invoice items for invoice display" 
ON public.invoice_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id
  )
);

-- Allow public payment recording for invoice payments
CREATE POLICY "Allow public payment recording for invoices" 
ON public.payments 
FOR INSERT 
WITH CHECK (invoice_id IS NOT NULL);

-- Allow public invoice status updates for payments
CREATE POLICY "Allow public invoice updates for payments" 
ON public.invoices 
FOR UPDATE 
USING (true);
