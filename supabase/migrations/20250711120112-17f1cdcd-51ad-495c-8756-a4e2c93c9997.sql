-- Update notifications type check constraint to include missing notification types
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;

-- Add updated constraint with all needed notification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'invoice_sent'::text, 
  'invoice_viewed'::text, 
  'payment_received'::text, 
  'invoice_overdue'::text, 
  'reminder_sent'::text,
  'invoice_paid'::text,
  'invoice_draft'::text,
  'invoice_cancelled'::text
]));