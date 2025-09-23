import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("CONFIRMATION_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    const {
      user,
      email_data: { token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
      };
      email_data: {
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    const confirmationUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to X Invoice - Confirm Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
            <table style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px auto; border-collapse: collapse;">
              <tr>
                <td style="text-align: center; vertical-align: middle; color: #f97316; font-size: 28px; font-weight: bold; line-height: 60px;">X</td>
              </tr>
            </table>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to X Invoice!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Please confirm your email to get started</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              🎉 Almost ready to go!
            </h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              Thank you for signing up for <strong style="color: #f97316;">X Invoice</strong>! 
              To complete your account setup and start creating professional invoices, please confirm your email address.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${confirmationUrl}" 
                 style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); 
                        color: #ffffff; 
                        padding: 16px 32px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: 600; 
                        font-size: 16px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        transition: all 0.2s ease;">
                Confirm Email Address
              </a>
            </div>

            <!-- Features Preview -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🚀 What's waiting for you:</h3>
              <div style="color: #4b5563; line-height: 1.8;">
                <div style="margin-bottom: 12px;">
                  <strong style="color: #0ea5e9;">✨ Professional Invoices:</strong> Create beautiful, branded invoices in seconds
                </div>
                <div style="margin-bottom: 12px;">
                  <strong style="color: #0ea5e9;">💳 Multiple Payment Methods:</strong> Accept payments via cards, crypto, and digital wallets
                </div>
                <div style="margin-bottom: 12px;">
                  <strong style="color: #0ea5e9;">📊 Business Analytics:</strong> Track your payments and business performance
                </div>
                <div>
                  <strong style="color: #0ea5e9;">🔄 Automated Reminders:</strong> Never miss a payment with smart follow-ups
                </div>
              </div>
            </div>

            <!-- Security Notice -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                🔒 Security Notice
              </h4>
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                This confirmation link expires in 24 hours for your security. 
                If you didn't create an X Invoice account, you can safely ignore this email.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
              Thank you for choosing X Invoice. We're excited to help you streamline your invoicing process and grow your business!
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 30px; text-align: center;">
            <table style="background-color: #f97316; width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 15px auto; border-collapse: collapse;">
              <tr>
                <td style="text-align: center; vertical-align: middle; color: #ffffff; font-size: 20px; font-weight: bold; line-height: 40px;">X</td>
              </tr>
            </table>
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
      from: "X Invoice <welcome@xinvoice.app>",
      to: [user.email],
      subject: "🎉 Welcome to X Invoice - Please Confirm Your Email",
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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