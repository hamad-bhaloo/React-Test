-- Enable required extensions for scheduling HTTP calls
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Ensure idempotent scheduling: try to unschedule existing job (ignore errors)
DO $$
BEGIN
  PERFORM cron.unschedule('invoice-reminders-hourly');
EXCEPTION WHEN OTHERS THEN
  -- ignore if job does not exist
  NULL;
END$$;

-- Schedule the invoice reminders function to run hourly
select
  cron.schedule(
    'invoice-reminders-hourly',
    '0 * * * *', -- every hour at minute 0
    $$
    select
      net.http_post(
        url := 'https://dsvtpfgkguhpkxcdquce.supabase.co/functions/v1/invoice-reminders',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object('time', now())
      ) as request_id;
    $$
  );