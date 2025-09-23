import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const APP_BASE_URL = Deno.env.get("PUBLIC_APP_URL") ?? ""; // e.g. https://app.yourdomain.com

function getHourInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value;
  return Number(hour ?? 0);
}

function getDateStringInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

function addDaysInTZ(date: Date, days: number, timeZone: string): Date {
  // Convert date to local components in TZ, then add days and reconstruct
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  const d = Number(parts.find((p) => p.type === "day")?.value ?? 1);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0)); // noon UTC to avoid DST edge cases
  return dt;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials");
    }

    if (!APP_BASE_URL) {
      // We need this to build public invoice links
      return new Response(JSON.stringify({
        error: "PUBLIC_APP_URL is not set. Please configure it in project secrets.",
      }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Helper to write reminder logs
    const logReminder = async (entry: {
      user_id: string;
      invoice_id?: string | null;
      status: 'queued' | 'attempted' | 'success' | 'failed' | 'skipped';
      message?: string | null;
      error?: string | null;
      attempt?: number;
      metadata?: Record<string, unknown>;
    }) => {
      try {
        await supabase.from('reminder_logs').insert([
          {
            user_id: entry.user_id,
            invoice_id: entry.invoice_id ?? null,
            status: entry.status,
            message: entry.message ?? null,
            error: entry.error ?? null,
            attempt: entry.attempt ?? 0,
            function_name: 'invoice-reminders',
            type: 'invoice',
            metadata: entry.metadata ?? {},
          },
        ]);
      } catch (e) {
        console.log('Failed to log reminder event', e);
      }
    };

    // 1) Load user settings to get timezones and reminder preference
    const { data: settingsRows, error: settingsError } = await supabase
      .from("user_settings")
      .select("user_id, settings_data");

    if (settingsError) throw settingsError;

    const now = new Date();
    let totalUsersChecked = 0;
    let totalEmailsSent = 0;

    // Cache company info per user
    const companyCache = new Map<string, { name: string; email: string | null } | null>();

    for (const row of settingsRows ?? []) {
      const userId = row.user_id as string;
      const settingsData = (row as any).settings_data || {};
      const tz = settingsData.timeZone || "UTC";
      const invoiceRemindersEnabled = settingsData.invoiceReminders !== false; // default true

      if (!invoiceRemindersEnabled) continue;
      totalUsersChecked++;

      // Compute local dates for 1/3/7 days overdue
      const oneDayAgo = addDaysInTZ(now, -1, tz);
      const threeDaysAgo = addDaysInTZ(now, -3, tz);
      const sevenDaysAgo = addDaysInTZ(now, -7, tz);

      const oneDayAgoLocal = getDateStringInTimeZone(oneDayAgo, tz);
      const threeDaysAgoLocal = getDateStringInTimeZone(threeDaysAgo, tz);
      const sevenDaysAgoLocal = getDateStringInTimeZone(sevenDaysAgo, tz);

      // 2) Fetch invoices for this user that are overdue by exactly 1, 3, or 7 days
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("id, user_id, client_id, invoice_number, total_amount, due_date, payment_status, reminder_count")
        .eq("user_id", userId)
        .neq("payment_status", "paid")
        .in("due_date", [oneDayAgoLocal, threeDaysAgoLocal, sevenDaysAgoLocal]);

      if (invError) {
        console.error("Error fetching invoices for user", userId, invError);
        continue;
      }

      if (!invoices || invoices.length === 0) continue;

      // Build client email map in one query
      const clientIds = Array.from(new Set((invoices.map((i: any) => i.client_id).filter(Boolean))));
      let clientEmailMap = new Map<string, { email: string | null; name: string | null }>();
      if (clientIds.length > 0) {
        const { data: clients, error: clientErr } = await supabase
          .from("clients")
          .select("id, email, name")
          .in("id", clientIds);
        if (clientErr) {
          console.log("Client fetch error for", userId, clientErr);
        } else {
          for (const c of clients ?? []) {
            clientEmailMap.set(c.id as string, { email: (c as any).email ?? null, name: (c as any).name ?? null });
          }
        }
      }

      // Load company sender details (cache per user)
      if (!companyCache.has(userId)) {
        const { data: company, error: compErr } = await supabase
          .from("companies")
          .select("name, email")
          .eq("user_id", userId)
          .maybeSingle();
        if (compErr) {
          console.log("Company fetch error for", userId, compErr);
          companyCache.set(userId, null);
        } else {
          companyCache.set(userId, company as any);
        }
      }

      const company = companyCache.get(userId);
      const senderName = company?.name || "Billing";
      const senderEmail = company?.email || "noreply@resend.dev";

      const thresholds = [1, 3, 7];

      for (const inv of invoices) {
        try {
          const rc = Number(inv.reminder_count ?? 0);
          if (rc >= thresholds.length) {
            continue; // already sent all reminders
          }

          let overdueDays = 0;
          if (inv.due_date === oneDayAgoLocal) overdueDays = 1;
          else if (inv.due_date === threeDaysAgoLocal) overdueDays = 3;
          else if (inv.due_date === sevenDaysAgoLocal) overdueDays = 7;

          // Send only if this invoice has reached or passed its next pending threshold
          if (overdueDays < thresholds[rc]) {
            continue;
          }

          const clientInfo = inv.client_id ? clientEmailMap.get(inv.client_id as string) : undefined;
          const clientEmail = clientInfo?.email ?? undefined;
          if (!clientEmail) {
            console.log("Skipping invoice without client email:", inv.id);
            await logReminder({
              user_id: userId,
              invoice_id: inv.id as string,
              status: 'skipped',
              message: 'Client email missing',
              attempt: rc + 1,
              metadata: { invoice_number: inv.invoice_number, overdueDays },
            });
            continue;
          }

          const subject = `Overdue by ${overdueDays} day${overdueDays > 1 ? "s" : ""}: Invoice ${inv.invoice_number}`;

          const publicLink = `${APP_BASE_URL.replace(/\/$/, "")}/invoice/${inv.id}/${inv.payment_link_id}`;
          const amount = (Number(inv.total_amount) || 0).toFixed(2);

          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg,#0f172a,#1e293b); padding: 20px; color: white; border-radius: 8px 8px 0 0;">
                 <h1 style="margin:0; font-size:20px;">${senderName}</h1>
                <p style="margin:6px 0 0 0; opacity:0.9;">Invoice Reminder</p>
              </div>
              <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="color:#374151;">Hello${clientInfo?.name ? ` ${clientInfo.name}` : ''},</p>
                <p style="color:#4b5563; line-height:1.6;">
                  This is a friendly reminder that invoice <strong>${inv.invoice_number}</strong> for <strong>$${amount}</strong>
                  is <strong>${overdueDays} day${overdueDays > 1 ? 's' : ''}</strong> overdue.
                </p>
                <div style="text-align:center; margin:24px 0;">
                  <a href="${publicLink}" style="background-color:#f97316;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">
                    View & Pay Invoice
                  </a>
                </div>
                <p style="color:#6b7280; font-size:13px;">If you have already sent the payment, please disregard this message.</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
                <p style="color:#6b7280; font-size:12px;">Sent by ${senderName} · ${senderEmail}</p>
              </div>
            </div>
          `;

          await logReminder({
            user_id: userId,
            invoice_id: inv.id as string,
            status: 'attempted',
            message: `Sending overdue reminder (${overdueDays}d)` ,
            attempt: rc + 1,
            metadata: { invoice_number: inv.invoice_number, to: clientEmail },
          });

          const emailResponse = await resend.emails.send({
            from: "no-reply@xinvoice.app",
            to: [clientEmail],
            subject,
            html,
          });

          console.log("Reminder sent:", { invoiceId: inv.id, to: clientEmail, emailResponse, rc_before: rc, overdueDays });
          totalEmailsSent++;

          await logReminder({
            user_id: userId,
            invoice_id: inv.id as string,
            status: 'success',
            message: `Reminder sent to ${clientEmail}`,
            attempt: rc + 1,
            metadata: { invoice_number: inv.invoice_number, emailResponse },
          });

          // Increment reminder_count to avoid duplicate sends
          const { error: updErr } = await supabase
            .from("invoices")
            .update({ reminder_count: rc + 1 })
            .eq("id", inv.id);
          if (updErr) {
            console.error("Failed to update reminder_count for invoice", inv.id, updErr);
          }
        } catch (sendErr) {
          console.error("Failed sending reminder for invoice", inv.id, sendErr);
          await logReminder({
            user_id: userId,
            invoice_id: inv.id as string,
            status: 'failed',
            message: 'Failed to send invoice reminder',
            error: String(sendErr?.message ?? sendErr),
            attempt: rc + 1,
            metadata: { invoice_number: inv.invoice_number },
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, totalUsersChecked, totalEmailsSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in invoice-reminders:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});