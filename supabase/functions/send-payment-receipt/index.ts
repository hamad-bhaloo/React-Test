import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReceiptRequest {
  sessionId: string;
  userEmail: string;
  amount: number;
  planName?: string;
  invoiceId?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMENT-RECEIPT] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment receipt function started");

    const { sessionId, userEmail, amount, planName, invoiceId }: PaymentReceiptRequest = await req.json();

    logStep("Request details", { sessionId, userEmail, amount, planName, invoiceId });

    if (!sessionId || !userEmail || !amount) {
      throw new Error("Missing required fields: sessionId, userEmail, or amount");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get company info if available
    let companyInfo = null;
    try {
      const { data: company } = await supabaseClient
        .from('companies')
        .select('name, email, phone, address, city, state, zip_code, country')
        .single();
      companyInfo = company;
    } catch (error) {
      logStep("No company info found", error);
    }

    const paymentDate = new Date().toLocaleDateString();
    const receiptNumber = `RCP-${sessionId.slice(-8).toUpperCase()}`;

    let emailSubject = "Payment Receipt - Thank you for your purchase";
    let emailContent = "";

    if (planName) {
      // Subscription payment
      emailSubject = `Payment Receipt - ${planName} Subscription`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Payment Receipt</h1>
              <p style="color: #6b7280; margin: 5px 0;">Receipt #${receiptNumber}</p>
            </div>
            
            <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #374151; margin-top: 0;">Subscription Details</h2>
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <span style="font-weight: bold;">Plan:</span>
                <span>${planName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <span style="font-weight: bold;">Amount:</span>
                <span>$${(amount / 100).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <span style="font-weight: bold;">Payment Date:</span>
                <span>${paymentDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0;">
                <span style="font-weight: bold;">Session ID:</span>
                <span style="font-family: monospace; font-size: 12px;">${sessionId}</span>
              </div>
            </div>

            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #0369a1;">
                <strong>✓ Payment Successful!</strong> Your ${planName} subscription is now active.
              </p>
            </div>

            ${companyInfo ? `
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <h3 style="color: #374151;">Billed by:</h3>
                <p style="margin: 5px 0; color: #6b7280;">
                  ${companyInfo.name}<br/>
                  ${companyInfo.email}
                  ${companyInfo.phone ? `<br/>${companyInfo.phone}` : ''}
                  ${companyInfo.address ? `<br/>${companyInfo.address}` : ''}
                  ${companyInfo.city ? `<br/>${companyInfo.city}, ${companyInfo.state} ${companyInfo.zip_code}` : ''}
                  ${companyInfo.country ? `<br/>${companyInfo.country}` : ''}
                </p>
              </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                Thank you for your business! If you have any questions about your subscription, please contact us.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (invoiceId) {
      // Invoice payment - get invoice details
      const { data: invoice } = await supabaseClient
        .from('invoices')
        .select(`
          invoice_number,
          total_amount,
          due_date,
          clients (
            name,
            email,
            phone
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoice) {
        emailSubject = `Payment Receipt - Invoice ${invoice.invoice_number}`;
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0;">Payment Received</h1>
                <p style="color: #6b7280; margin: 5px 0;">Receipt #${receiptNumber}</p>
              </div>
              
              <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #374151; margin-top: 0;">Invoice Payment Details</h2>
                <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                  <span style="font-weight: bold;">Invoice #:</span>
                  <span>${invoice.invoice_number}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                  <span style="font-weight: bold;">Amount Paid:</span>
                  <span>$${(amount / 100).toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                  <span style="font-weight: bold;">Payment Date:</span>
                  <span>${paymentDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0;">
                  <span style="font-weight: bold;">Transaction ID:</span>
                  <span style="font-family: monospace; font-size: 12px;">${sessionId}</span>
                </div>
              </div>

              <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #065f46;">
                  <strong>✓ Payment Complete!</strong> Your invoice has been marked as paid.
                </p>
              </div>

              ${companyInfo ? `
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <h3 style="color: #374151;">Paid to:</h3>
                  <p style="margin: 5px 0; color: #6b7280;">
                    ${companyInfo.name}<br/>
                    ${companyInfo.email}
                    ${companyInfo.phone ? `<br/>${companyInfo.phone}` : ''}
                    ${companyInfo.address ? `<br/>${companyInfo.address}` : ''}
                    ${companyInfo.city ? `<br/>${companyInfo.city}, ${companyInfo.state} ${companyInfo.zip_code}` : ''}
                    ${companyInfo.country ? `<br/>${companyInfo.country}` : ''}
                  </p>
                </div>
              ` : ''}

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Thank you for your payment! Keep this receipt for your records.
                </p>
              </div>
            </div>
          </div>
        `;
      }
    }

    logStep("Sending payment receipt email", { to: userEmail, subject: emailSubject });

    const emailResponse = await resend.emails.send({
      from: "X Invoice <no-reply@xinvoice.app>",
      to: [userEmail],
      subject: emailSubject,
      html: emailContent,
    });

    logStep("Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    logStep("ERROR in send-payment-receipt", { message: error.message });
    console.error("Error in send-payment-receipt function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);