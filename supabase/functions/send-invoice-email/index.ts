
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  to: string;
  subject?: string;
  message?: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  publicLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      subject, 
      message, 
      invoiceId, 
      invoiceNumber, 
      amount, 
      dueDate, 
      publicLink 
    }: InvoiceEmailRequest = await req.json();

    console.log('Sending invoice email:', { to, invoiceNumber, amount });

    const emailSubject = subject || `Invoice ${invoiceNumber} - Payment Required`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">Invoice ${invoiceNumber}</h1>
        </div>
        
        <div style="padding: 30px;">
          ${message ? `<p style="color: #666; line-height: 1.6;">${message}</p>` : ''}
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Invoice Details</h2>
            <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p><strong>Amount Due:</strong> $${amount}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${publicLink}" 
               style="background-color: #f97316; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold;">
              View & Pay Invoice
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            You can view your invoice and pay securely using the link above. 
            We accept credit cards and cryptocurrency payments.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you have any questions about this invoice, please contact us.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "X Invoice <no-reply@xinvoice.app>",
      to: [to],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
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
