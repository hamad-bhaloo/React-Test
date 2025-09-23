-- Add crypto_wallet_address field to profiles table for payout address
ALTER TABLE public.profiles 
ADD COLUMN crypto_wallet_address text;