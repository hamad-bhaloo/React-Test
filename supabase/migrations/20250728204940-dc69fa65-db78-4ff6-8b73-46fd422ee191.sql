-- Add status column to profiles table for user blocking functionality
ALTER TABLE public.profiles 
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'blocked'));