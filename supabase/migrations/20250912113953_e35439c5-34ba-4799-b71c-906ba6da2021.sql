-- Create reminder tracking table
CREATE TABLE public.user_reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('no_invoice_3d', 'no_invoice_5d', 'no_invoice_7d', 'monthly_marketing')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_sent BOOLEAN DEFAULT true,
  email_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all reminder logs" 
ON public.user_reminder_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create reminder logs" 
ON public.user_reminder_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_user_reminder_logs_user_id ON public.user_reminder_logs(user_id);
CREATE INDEX idx_user_reminder_logs_type_sent ON public.user_reminder_logs(reminder_type, sent_at);

-- Add columns to profiles for tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;