-- Add foreign key relationship between quotation_items and quotations
ALTER TABLE public.quotation_items 
ADD CONSTRAINT quotation_items_quotation_id_fkey 
FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;