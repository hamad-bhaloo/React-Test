import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendQuotationEmailRequest {
  quotationId: string;
  recipientEmail: string;
  subject: string;
  message?: string;
  includeAttachments?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { quotationId, recipientEmail, subject, message = "", includeAttachments = false }: SendQuotationEmailRequest = await req.json();

    if (!quotationId || !recipientEmail || !subject) {
      throw new Error("Missing required fields");
    }

    // Get quotation data
    const { data: quotation, error: quotationError } = await supabaseClient
      .from("quotations")
      .select(`
        *,
        clients (
          name,
          first_name,
          last_name,
          email,
          company
        ),
        quotation_items (
          product_name,
          description,
          quantity,
          rate,
          amount
        )
      `)
      .eq("id", quotationId)
      .eq("user_id", user.id)
      .single();

    if (quotationError || !quotation) {
      throw new Error("Quotation not found");
    }

    // Get user company info
    const { data: company } = await supabaseClient
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const clientName = quotation.clients?.name || 
                      `${quotation.clients?.first_name || ''} ${quotation.clients?.last_name || ''}`.trim() ||
                      quotation.clients?.company || 
                      'Valued Client';

    // Create public quotation link (implement this later)
    const quotationLink = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/quotation/${quotation.id}`;

    // Generate HTML email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .quotation-details { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background: #f2f2f2; }
            .total-section { text-align: right; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
            .btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Quotation ${quotation.quotation_number}</h1>
            ${company?.name ? `<p>From: ${company.name}</p>` : ''}
          </div>
          
          <div class="content">
            <p>Dear ${clientName},</p>
            
            ${message ? `<p>${message}</p>` : ''}
            
            <p>Please find below the details of quotation ${quotation.quotation_number}:</p>
            
            <div class="quotation-details">
              <p><strong>Quotation Number:</strong> ${quotation.quotation_number}</p>
              <p><strong>Issue Date:</strong> ${new Date(quotation.issue_date).toLocaleDateString()}</p>
              <p><strong>Valid Until:</strong> ${new Date(quotation.valid_until).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> ${quotation.currency} ${quotation.total_amount?.toFixed(2) || '0.00'}</p>
            </div>
            
            <h3>Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product/Service</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${quotation.quotation_items?.map((item: any) => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>${item.description || '-'}</td>
                    <td>${item.quantity}</td>
                    <td>${quotation.currency} ${item.rate?.toFixed(2) || '0.00'}</td>
                    <td>${quotation.currency} ${item.amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
            
            <div class="total-section">
              <p><strong>Subtotal: ${quotation.currency} ${quotation.subtotal?.toFixed(2) || '0.00'}</strong></p>
              ${quotation.discount_amount > 0 ? `<p>Discount: -${quotation.currency} ${quotation.discount_amount?.toFixed(2)}</p>` : ''}
              ${quotation.tax_amount > 0 ? `<p>Tax: ${quotation.currency} ${quotation.tax_amount?.toFixed(2)}</p>` : ''}
              ${quotation.shipping_charge > 0 ? `<p>Shipping: ${quotation.currency} ${quotation.shipping_charge?.toFixed(2)}</p>` : ''}
              <h3>Total: ${quotation.currency} ${quotation.total_amount?.toFixed(2) || '0.00'}</h3>
            </div>
            
            ${quotation.terms ? `<div><h4>Terms & Conditions:</h4><p>${quotation.terms}</p></div>` : ''}
            ${quotation.notes ? `<div><h4>Notes:</h4><p>${quotation.notes}</p></div>` : ''}
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${quotationLink}" class="btn">View Quotation Online</a>
            </p>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            ${company?.email ? `<p>Contact us: ${company.email}</p>` : ''}
            ${company?.phone ? `<p>Phone: ${company.phone}</p>` : ''}
          </div>
        </body>
      </html>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "X Invoice <no-reply@xinvoice.app>",
      to: [recipientEmail],
      subject: subject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    // Log the email in database
    await supabaseClient
      .from("quotation_emails")
      .insert({
        quotation_id: quotationId,
        user_id: user.id,
        recipient_email: recipientEmail,
        subject: subject,
        message: message,
      });

    // Update quotation status to 'sent' if it's currently 'draft'
    if (quotation.status === 'draft') {
      await supabaseClient
        .from("quotations")
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq("id", quotationId);
    }

    console.log("Quotation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-quotation-email function:", error);
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