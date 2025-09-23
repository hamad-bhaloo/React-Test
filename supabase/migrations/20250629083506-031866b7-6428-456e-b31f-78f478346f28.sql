
-- Create wallet table to track user wallet balances
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table to record all wallet transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'payment', 'refund')),
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT CHECK (payment_method IN ('wallet', 'crypto', 'card', 'bank_transfer')),
  description TEXT,
  reference_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payment link fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_link_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_methods_enabled JSONB DEFAULT '["wallet", "crypto", "card"]'::jsonb;

-- Enable RLS on new tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update wallet balance based on transaction type
  IF NEW.type = 'credit' THEN
    UPDATE public.wallets 
    SET balance = balance + NEW.amount, updated_at = now()
    WHERE id = NEW.wallet_id;
  ELSIF NEW.type = 'debit' OR NEW.type = 'payment' THEN
    UPDATE public.wallets 
    SET balance = balance - NEW.amount, updated_at = now()
    WHERE id = NEW.wallet_id;
  ELSIF NEW.type = 'refund' THEN
    UPDATE public.wallets 
    SET balance = balance + NEW.amount, updated_at = now()
    WHERE id = NEW.wallet_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update wallet balance
CREATE TRIGGER trigger_update_wallet_balance
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

-- Create function to initialize user wallet
CREATE OR REPLACE FUNCTION initialize_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'USD')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize wallet on user creation
CREATE TRIGGER trigger_initialize_user_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_wallet();

-- Add unique constraint to ensure one wallet per user
ALTER TABLE public.wallets ADD CONSTRAINT unique_user_wallet UNIQUE (user_id);
