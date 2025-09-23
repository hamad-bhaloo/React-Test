-- Add foreign key relationship between quotations and clients
ALTER TABLE public.quotations 
ADD CONSTRAINT quotations_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id);