
-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT CHECK (subscription_tier IN ('Free', 'Basic', 'Standard', 'Premium')),
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create plan_limits table to define limits for each subscription tier
CREATE TABLE public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  max_clients INTEGER,
  max_invoices INTEGER,
  max_pdfs INTEGER,
  max_emails INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert plan limits based on the image
INSERT INTO public.plan_limits (plan_name, max_clients, max_invoices, max_pdfs, max_emails) VALUES
('Free', 3, 3, 3, 3),
('Basic', 15, 30, 30, 30),
('Standard', 200, 100, 200, 200),
('Premium', -1, -1, -1, -1); -- -1 means unlimited

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers table
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
FOR UPDATE USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Insert subscription" ON public.subscribers
FOR INSERT WITH CHECK (true);

-- Create policies for plan_limits table (read-only for all authenticated users)
CREATE POLICY "All users can view plan limits" ON public.plan_limits
FOR SELECT USING (auth.uid() IS NOT NULL);
