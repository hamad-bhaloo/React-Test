-- Create table for reminder/cron logs
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invoice_id UUID NULL,
  function_name TEXT NOT NULL DEFAULT 'invoice-reminders',
  type TEXT NOT NULL DEFAULT 'invoice',
  status TEXT NOT NULL CHECK (status IN ('queued','attempted','success','failed','skipped')),
  message TEXT NULL,
  error TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempt INTEGER NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_created_at ON public.reminder_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_status ON public.reminder_logs (status);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_invoice ON public.reminder_logs (invoice_id);

-- Foreign key to invoices for better linking (set null on delete)
ALTER TABLE public.reminder_logs
  ADD CONSTRAINT reminder_logs_invoice_fk
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Enable RLS for secure per-user access
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own logs
CREATE POLICY "Users can view their own reminder logs"
ON public.reminder_logs
FOR SELECT
USING (auth.uid() = user_id);
