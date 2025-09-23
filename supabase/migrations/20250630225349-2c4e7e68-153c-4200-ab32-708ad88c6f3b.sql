
-- First, let's check if the trigger function exists and recreate it with proper permissions
DROP FUNCTION IF EXISTS public.initialize_user_wallet() CASCADE;

-- Create the function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.initialize_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'CREDITS')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_initialize_user_wallet ON auth.users;
CREATE TRIGGER trigger_initialize_user_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_wallet();

-- Add unique constraint (without IF NOT EXISTS since it's not supported in this context)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_wallet' 
        AND conrelid = 'public.wallets'::regclass
    ) THEN
        ALTER TABLE public.wallets ADD CONSTRAINT unique_user_wallet UNIQUE (user_id);
    END IF;
END $$;
