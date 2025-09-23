-- Enable the pg_cron extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension if it's not already enabled  
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the no-invoice reminder function to run daily at 10 AM UTC
SELECT cron.schedule(
  'send-no-invoice-reminders-daily',
  '0 10 * * *', -- Run at 10:00 AM UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://dsvtpfgkguhpkxcdquce.supabase.co/functions/v1/schedule-no-invoice-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdnRwZmdrZ3VocGt4Y2RxdWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzMxMTQsImV4cCI6MjA2NjU0OTExNH0.ueAfEz7nSwVJUTR5ha_l4D9j9B2bIQOkkkDOEpd7_G0"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);