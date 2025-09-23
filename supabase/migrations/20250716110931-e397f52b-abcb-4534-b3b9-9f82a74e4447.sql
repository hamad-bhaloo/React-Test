-- Create plan limits for all subscription plans
INSERT INTO public.plan_limits (plan_name, max_clients, max_invoices, max_pdfs, max_emails) VALUES
('Free', 3, 3, 3, 3),
('Basic', 15, 30, 30, 30),
('Standard', 200, 100, 200, 200),
('Premium', -1, -1, -1, -1)
ON CONFLICT (plan_name) DO UPDATE SET
  max_clients = EXCLUDED.max_clients,
  max_invoices = EXCLUDED.max_invoices,
  max_pdfs = EXCLUDED.max_pdfs,
  max_emails = EXCLUDED.max_emails;