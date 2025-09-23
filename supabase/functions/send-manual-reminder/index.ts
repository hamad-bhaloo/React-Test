import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
console.log('RESEND_API_KEY configured:', !!resendApiKey);

if (!resendApiKey) {
  console.error('RESEND_API_KEY is not configured');
}

const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManualReminderRequest {
  invoiceId: string;
  type: 'overdue' | 'gentle' | 'final';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, type }: ManualReminderRequest = await req.json();

    if (!invoiceId || !type) {
      return new Response(
        JSON.stringify({ error: "Invoice ID and reminder type are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice with client data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Error fetching invoice:', invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if client has email
    if (!invoice.clients?.email) {
      return new Response(
        JSON.stringify({ error: "No email address found for this client" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single();

    if (companyError) {
      console.error('Error fetching company:', companyError);
    }

    // Prepare reminder content based on type
    let subject = '';
    let content = '';
    const invoiceUrl = `${Deno.env.get('PUBLIC_APP_URL')}/invoice/${invoice.id}/${invoice.payment_link_id}`;
    const daysPastDue = Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));

    switch (type) {
      case 'gentle':
        subject = `Friendly Reminder: Invoice ${invoice.invoice_number} Payment Due`;
        content = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Friendly Payment Reminder</h2>
            <p>Dear ${invoice.clients.name || invoice.clients.first_name + ' ' + invoice.clients.last_name},</p>
            <p>We hope this message finds you well. This is a friendly reminder that payment for the following invoice is due:</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Amount Due:</strong> $${Number(invoice.total_amount).toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
            
            <p>You can view and pay your invoice securely by clicking the link below:</p>
            <p><a href="${invoiceUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Invoice</a></p>
            
            <p>If you have already made this payment, please disregard this reminder. If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Thank you for your business!</p>
            ${company ? `<p>Best regards,<br>${company.name}</p>` : ''}
          </div>
        `;
        break;
        
      case 'overdue':
        subject = `Payment Overdue: Invoice ${invoice.invoice_number} - ${daysPastDue} Days Past Due`;
        content = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Payment Overdue Notice</h2>
            <p>Dear ${invoice.clients.name || invoice.clients.first_name + ' ' + invoice.clients.last_name},</p>
            <p>This is to inform you that the following invoice is now <strong>${daysPastDue} days overdue</strong>:</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Amount Due:</strong> $${Number(invoice.total_amount).toFixed(2)}</p>
              <p><strong>Original Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
              <p><strong>Days Overdue:</strong> ${daysPastDue}</p>
            </div>
            
            <p>Please arrange payment immediately to avoid any late fees or service interruption.</p>
            <p><a href="${invoiceUrl}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Pay Now</a></p>
            
            <p>If you have already made this payment, please contact us immediately. If you are experiencing financial difficulties, please reach out to discuss payment arrangements.</p>
            
            ${company ? `<p>Best regards,<br>${company.name}</p>` : ''}
          </div>
        `;
        break;
        
      case 'final':
        subject = `FINAL NOTICE: Invoice ${invoice.invoice_number} - Immediate Payment Required`;
        content = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">FINAL PAYMENT NOTICE</h2>
            <p>Dear ${invoice.clients.name || invoice.clients.first_name + ' ' + invoice.clients.last_name},</p>
            <p><strong>This is a final notice regarding the overdue payment for invoice ${invoice.invoice_number}.</strong></p>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Amount Due:</strong> $${Number(invoice.total_amount).toFixed(2)}</p>
              <p><strong>Original Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
              <p><strong>Days Overdue:</strong> ${daysPastDue}</p>
            </div>
            
            <p><strong>IMMEDIATE ACTION REQUIRED:</strong> Payment must be received within 7 days of this notice to avoid collection proceedings.</p>
            <p><a href="${invoiceUrl}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">MAKE PAYMENT NOW</a></p>
            
            <p>Failure to remit payment may result in:</p>
            <ul>
              <li>Account suspension</li>
              <li>Late fees and interest charges</li>
              <li>Referral to collection agency</li>
              <li>Legal action</li>
            </ul>
            
            <p>If payment has been made, please contact us immediately with proof of payment.</p>
            
            ${company ? `<p>Best regards,<br>${company.name}</p>` : ''}
          </div>
        `;
        break;
    }

    // Send reminder email
    console.log('Attempting to send email to:', invoice.clients.email);
    console.log('Subject:', subject);
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const emailResponse = await resend.emails.send({
      from: "no-reply@xinvoice.app",
      to: [invoice.clients.email],
      subject: "Invoice Reminder",
      html: content,
    });

    console.log("Manual reminder email response:", JSON.stringify(emailResponse, null, 2));
    
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    // Log the reminder
    const { error: logError } = await supabase
      .from('reminder_logs')
      .insert({
        invoice_id: invoice.id,
        user_id: invoice.user_id,
        type: 'invoice',
        status: 'sent',
        attempt: (invoice.reminder_count || 0) + 1,
        message: `Manual ${type} reminder sent`,
        metadata: {
          reminder_type: type,
          email_id: emailResponse.data?.id,
          manual: true
        }
      });

    if (logError) {
      console.error('Error logging reminder:', logError);
    }

    // Update reminder count
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        reminder_count: (invoice.reminder_count || 0) + 1
      })
      .eq('id', invoice.id);

    if (updateError) {
      console.error('Error updating reminder count:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${type} reminder sent successfully`,
        emailId: emailResponse.data?.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error sending manual reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);