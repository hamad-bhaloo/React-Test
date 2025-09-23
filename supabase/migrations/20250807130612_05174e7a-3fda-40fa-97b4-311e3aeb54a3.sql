-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  receipt_url TEXT,
  vendor_name TEXT,
  tax_amount NUMERIC DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- monthly, quarterly, yearly
  recurring_end_date DATE,
  tags TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  budget_limit NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense budgets table
CREATE TABLE public.expense_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  spent_amount NUMERIC DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exceeded', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense analytics table for insights
CREATE TABLE public.expense_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- savings_opportunity, budget_alert, trend_analysis, cost_reduction
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  potential_savings NUMERIC DEFAULT 0,
  action_items JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expenses
CREATE POLICY "Users can manage their own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expense categories" ON public.expense_categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expense budgets" ON public.expense_budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own expense insights" ON public.expense_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create expense insights" ON public.expense_insights
  FOR INSERT WITH CHECK (true);

-- Create function to update expense budget spent amounts
CREATE OR REPLACE FUNCTION public.update_expense_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
  -- Update budget spent amount when expense is added/updated/deleted
  UPDATE public.expense_budgets 
  SET 
    spent_amount = (
      SELECT COALESCE(SUM(e.amount), 0)
      FROM public.expenses e
      JOIN public.expense_categories ec ON e.category = ec.name
      WHERE ec.id = expense_budgets.category_id
        AND e.expense_date >= expense_budgets.start_date
        AND e.expense_date <= expense_budgets.end_date
        AND e.status = 'approved'
        AND e.user_id = expense_budgets.user_id
    ),
    status = CASE 
      WHEN spent_amount > budget_amount THEN 'exceeded'
      WHEN end_date < CURRENT_DATE THEN 'completed'
      ELSE 'active'
    END,
    updated_at = now()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for budget updates
CREATE TRIGGER update_expense_budgets_on_expense_change
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_budget_spent();

-- Create function to automatically categorize expenses
CREATE OR REPLACE FUNCTION public.update_expense_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for expense timestamps
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_timestamps();

CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_timestamps();

CREATE TRIGGER update_expense_budgets_updated_at
  BEFORE UPDATE ON public.expense_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_timestamps();

-- Insert default expense categories
INSERT INTO public.expense_categories (user_id, name, description, color) VALUES
  (auth.uid(), 'Office Supplies', 'Pens, paper, equipment', '#3b82f6'),
  (auth.uid(), 'Marketing', 'Advertising, promotions, campaigns', '#f59e0b'),
  (auth.uid(), 'Travel', 'Business trips, transportation', '#10b981'),
  (auth.uid(), 'Software', 'Subscriptions, licenses, tools', '#8b5cf6'),
  (auth.uid(), 'Utilities', 'Internet, phone, electricity', '#ef4444'),
  (auth.uid(), 'Meals', 'Business meals, client entertainment', '#f97316'),
  (auth.uid(), 'Equipment', 'Computers, furniture, machinery', '#6366f1'),
  (auth.uid(), 'Professional Services', 'Legal, accounting, consulting', '#14b8a6'),
  (auth.uid(), 'Rent', 'Office rent, storage space', '#84cc16'),
  (auth.uid(), 'Miscellaneous', 'Other business expenses', '#64748b')
ON CONFLICT DO NOTHING;