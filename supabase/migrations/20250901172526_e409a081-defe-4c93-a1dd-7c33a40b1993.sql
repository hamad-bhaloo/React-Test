-- Create FBR submissions table for tracking invoice submissions to Federal Board of Revenue
CREATE TABLE public.fbr_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  fbr_reference TEXT,
  submission_status TEXT NOT NULL DEFAULT 'submitted',
  submission_data JSONB NOT NULL DEFAULT '{}',
  fbr_response JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fbr_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for FBR submissions
CREATE POLICY "Users can view their own FBR submissions" 
ON public.fbr_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own FBR submissions" 
ON public.fbr_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FBR submissions" 
ON public.fbr_submissions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fbr_submissions_updated_at
BEFORE UPDATE ON public.fbr_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_fbr_submissions_user_id ON public.fbr_submissions(user_id);
CREATE INDEX idx_fbr_submissions_invoice_id ON public.fbr_submissions(invoice_id);
CREATE INDEX idx_fbr_submissions_status ON public.fbr_submissions(submission_status);