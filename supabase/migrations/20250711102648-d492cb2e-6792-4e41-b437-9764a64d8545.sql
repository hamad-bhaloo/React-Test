-- Create debt_collections table
CREATE TABLE public.debt_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID,
  collection_notes TEXT,
  next_action_date DATE,
  last_contact_date DATE,
  contact_attempts INTEGER DEFAULT 0,
  amount_collected NUMERIC DEFAULT 0,
  collection_fees NUMERIC DEFAULT 0,
  settlement_amount NUMERIC,
  settlement_date DATE,
  external_agency TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create debt_collection_activities table for tracking all collection activities
CREATE TABLE public.debt_collection_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_collection_id UUID NOT NULL REFERENCES public.debt_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC,
  contact_method TEXT,
  outcome TEXT,
  next_action TEXT,
  next_action_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create debt_collection_templates table for standardized messages
CREATE TABLE public.debt_collection_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debt_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_collection_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_collection_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for debt_collections
CREATE POLICY "Users can view their own debt collections" 
ON public.debt_collections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debt collections" 
ON public.debt_collections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt collections" 
ON public.debt_collections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt collections" 
ON public.debt_collections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for debt_collection_activities
CREATE POLICY "Users can view their own debt collection activities" 
ON public.debt_collection_activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debt collection activities" 
ON public.debt_collection_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt collection activities" 
ON public.debt_collection_activities 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for debt_collection_templates
CREATE POLICY "Users can manage their own debt collection templates" 
ON public.debt_collection_templates 
FOR ALL 
USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_debt_collections_updated_at
BEFORE UPDATE ON public.debt_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_debt_collection_templates_updated_at
BEFORE UPDATE ON public.debt_collection_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_debt_collections_user_id ON public.debt_collections(user_id);
CREATE INDEX idx_debt_collections_invoice_id ON public.debt_collections(invoice_id);
CREATE INDEX idx_debt_collections_status ON public.debt_collections(status);
CREATE INDEX idx_debt_collections_next_action_date ON public.debt_collections(next_action_date);
CREATE INDEX idx_debt_collection_activities_debt_collection_id ON public.debt_collection_activities(debt_collection_id);
CREATE INDEX idx_debt_collection_templates_user_id ON public.debt_collection_templates(user_id);