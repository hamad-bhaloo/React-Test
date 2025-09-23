-- Update Free plan limits from 3 to 8
UPDATE plan_limits 
SET 
  max_clients = 8,
  max_invoices = 8,
  max_pdfs = 8,
  max_emails = 8
WHERE plan_name = 'Free';