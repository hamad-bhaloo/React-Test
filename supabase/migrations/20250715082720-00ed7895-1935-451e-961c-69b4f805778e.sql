-- Add document attachments support to quotations table
ALTER TABLE public.quotations 
ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;

-- Create quotation emails tracking table for sending functionality
CREATE TABLE public.quotation_emails (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    recipient_email text NOT NULL,
    subject text NOT NULL,
    message text,
    sent_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on quotation_emails
ALTER TABLE public.quotation_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for quotation_emails
CREATE POLICY "Users can view their own quotation emails" 
ON public.quotation_emails 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotation emails" 
ON public.quotation_emails 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for quotation attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quotation-attachments', 'quotation-attachments', false);

-- Create storage policies for quotation attachments
CREATE POLICY "Users can upload their own quotation attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'quotation-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own quotation attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'quotation-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own quotation attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'quotation-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own quotation attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'quotation-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);