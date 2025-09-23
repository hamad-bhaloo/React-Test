-- Create quotations table
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  quotation_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  subtotal NUMERIC DEFAULT 0,
  tax_percentage NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  shipping_charge NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  converted_to_invoice_id UUID,
  template_id INTEGER
);

-- Create quotation_items table
CREATE TABLE public.quotation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID,
  product_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  rate NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- Create policies for quotations
CREATE POLICY "Users can view their own quotations" 
ON public.quotations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotations" 
ON public.quotations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotations" 
ON public.quotations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotations" 
ON public.quotations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for quotation_items
CREATE POLICY "Users can view their own quotation items" 
ON public.quotation_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.quotations 
  WHERE quotations.id = quotation_items.quotation_id 
  AND quotations.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own quotation items" 
ON public.quotation_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.quotations 
  WHERE quotations.id = quotation_items.quotation_id 
  AND quotations.user_id = auth.uid()
));

CREATE POLICY "Users can update their own quotation items" 
ON public.quotation_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.quotations 
  WHERE quotations.id = quotation_items.quotation_id 
  AND quotations.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own quotation items" 
ON public.quotation_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.quotations 
  WHERE quotations.id = quotation_items.quotation_id 
  AND quotations.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotation_items_updated_at
BEFORE UPDATE ON public.quotation_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update quotation totals when items change
CREATE TRIGGER update_quotation_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.quotation_items
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_totals();