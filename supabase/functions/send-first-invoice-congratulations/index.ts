import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FirstInvoiceRequest {
  userId: string;
  invoiceId: string;
  invoiceNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, invoiceId, invoiceNumber }: FirstInvoiceRequest = await req.json();

    if (!userId || !invoiceId || !invoiceNumber) {
      return new Response(
        JSON.stringify({ error: "User ID, invoice ID, and invoice number are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice data to retrieve payment link ID
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('payment_link_id')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoiceData) {
      throw new Error(`Error fetching invoice: ${invoiceError?.message || 'Invoice not found'}`);
    }

    const paymentLinkId = invoiceData.payment_link_id;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Error fetching user profile: ${profileError?.message || 'Profile not found'}`);
    }

    // Check if this is actually the user's first invoice
    const { data: invoiceCount, error: countError } = await supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error checking invoice count:', countError);
    }

    const isFirstInvoice = (invoiceCount?.length || 0) === 1;

    if (!isFirstInvoice) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Not the user's first invoice" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const congratulationsEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Congratulations on Your First Invoice!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
            <div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="font-size: 40px;">🎉</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Congratulations!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">You've created your first invoice</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              🌟 Amazing job${profile.full_name ? `, ${profile.full_name}` : ''}!
            </h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              You've just taken a huge step forward in professionalizing your business! 
              Your first invoice <strong style="color: #10b981;">${invoiceNumber}</strong> has been created successfully.
            </p>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              This is just the beginning of your journey with <strong style="color: #10b981;">X Invoice</strong>. 
              You're now equipped with a powerful tool to manage your invoicing and get paid faster.
            </p>

            <!-- Achievement Badge -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 30px; margin: 30px 0; border-left: 4px solid #10b981; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">🏆</div>
              <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 20px; font-weight: 700;">First Invoice Created!</h3>
              <p style="color: #047857; margin: 0; font-size: 16px; font-weight: 500;">
                Invoice ${invoiceNumber} • ${new Date().toLocaleDateString()}
              </p>
            </div>

            <!-- What's Next -->
            <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🚀 What's Next?</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Send Your Invoice:</strong> Share it with your client and get paid</li>
                <li><strong>Track Payments:</strong> Monitor when your invoice is viewed and paid</li>
                <li><strong>Set Up Reminders:</strong> Automate follow-ups for overdue payments</li>
                <li><strong>Add More Clients:</strong> Build your client database</li>
                <li><strong>Customize Templates:</strong> Make your invoices uniquely yours</li>
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${Deno.env.get('PUBLIC_APP_URL')}/invoice/${invoiceId}/${paymentLinkId}" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                        color: #ffffff; 
                        padding: 16px 32px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: 600; 
                        font-size: 16px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        transition: all 0.2s ease;">
                View Your Invoice
              </a>
            </div>

            <!-- Pro Tips -->
            <div style="background-color: #f0f9ff; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💡 Pro Tips for Success:</h3>
              <div style="color: #4b5563; line-height: 1.8;">
                <div style="margin-bottom: 12px;">
                  <strong style="color: #0ea5e9;">✓ Send Promptly:</strong> Send invoices immediately after work completion
                </div>
                <div style="margin-bottom: 12px;">
                  <strong style="color: #0ea5e9;">✓ Clear Terms:</strong> Always include clear payment terms and due dates
                </div>
                <div style="margin-bottom: 12px;">
                  <strong style="color: #0ea5e9;">✓ Follow Up:</strong> Use automated reminders for better payment rates
                </div>
                <div>
                  <strong style="color: #0ea5e9;">✓ Stay Professional:</strong> Branded invoices build trust and credibility
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 25px; margin: 30px 0; color: white; text-align: center;">
              <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📊 Did You Know?</h3>
              <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
                <div style="margin: 10px;">
                  <div style="font-size: 24px; font-weight: bold; color: #10b981;">30%</div>
                  <div style="font-size: 12px; color: #d1d5db;">Faster payments with professional invoices</div>
                </div>
                <div style="margin: 10px;">
                  <div style="font-size: 24px; font-weight: bold; color: #10b981;">85%</div>
                  <div style="font-size: 12px; color: #d1d5db;">Of businesses prefer automated invoicing</div>
                </div>
                <div style="margin: 10px;">
                  <div style="font-size: 24px; font-weight: bold; color: #10b981;">50%</div>
                  <div style="font-size: 12px; color: #d1d5db;">Reduction in late payments</div>
                </div>
              </div>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
              You're now part of thousands of successful businesses using X Invoice to streamline their billing process. 
              Keep up the great work!
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 30px; text-align: center;">
            <div style="background-color: #10b981; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <span style="color: #ffffff; font-size: 20px; font-weight: bold;">X</span>
            </div>
            <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
              <strong style="color: #ffffff;">X Invoice</strong> - Professional Invoice Management
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 12px;">
              © 2024 X Invoice. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "X Invoice <success@xinvoice.app>",
      to: [profile.email],
      subject: "🎉 Congratulations! You've Created Your First Invoice",
      html: congratulationsEmailHtml,
    });

    console.log("First invoice congratulations email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "First invoice congratulations email sent successfully",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending first invoice congratulations email:", error);
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