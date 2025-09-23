import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, name }: WelcomeEmailRequest = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "User ID and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const welcomeEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to X Invoice</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
            <div style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: #f97316; font-size: 28px; font-weight: bold;">X</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to X Invoice!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Your invoicing journey starts here</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              🎉 Welcome aboard${name ? `, ${name}` : ''}!
            </h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              Congratulations on successfully setting up your <strong style="color: #f97316;">X Invoice</strong> account! 
              You're now ready to create professional invoices and manage your business finances with ease.
            </p>

            <!-- Quick Start Guide -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🚀 Quick Start Guide</h3>
              <div style="color: #4b5563; line-height: 1.8;">
                <div style="margin-bottom: 12px;">
                  <strong style="color: #0ea5e9;">Step 1:</strong> Complete your company profile for professional invoices
                </div>
                <div style="margin-bottom: 12px;">
                  <strong style="color: #0ea5e9;">Step 2:</strong> Add your first client to get started
                </div>
                <div style="margin-bottom: 12px;">
                  <strong style="color: #0ea5e9;">Step 3:</strong> Create your first invoice in minutes
                </div>
                <div>
                  <strong style="color: #0ea5e9;">Step 4:</strong> Send and track payments effortlessly
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${Deno.env.get('PUBLIC_APP_URL')}" 
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
                Get Started Now
              </a>
            </div>

            <!-- Features Preview -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">✨ What you can do with X Invoice:</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Professional Invoices:</strong> Create beautiful, branded invoices in seconds</li>
                <li><strong>Client Management:</strong> Keep all your client information organized</li>
                <li><strong>Payment Tracking:</strong> Monitor payments and send automatic reminders</li>
                <li><strong>Multiple Payment Methods:</strong> Accept payments via cards, crypto, and wallet</li>
                <li><strong>Analytics & Reports:</strong> Track your business performance</li>
                <li><strong>Mobile Ready:</strong> Access your invoices anywhere, anytime</li>
              </ul>
            </div>

            <!-- Support Section -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                💬 Need Help Getting Started?
              </h4>
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                Our support team is here to help! If you have any questions or need assistance, 
                don't hesitate to reach out. We're committed to your success.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
              Thank you for choosing X Invoice. We're excited to be part of your business journey and can't wait to see what you'll achieve!
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 30px; text-align: center;">
            <div style="background-color: #f97316; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
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
      from: "X Invoice <welcome@xinvoice.app>",
      to: [email],
      subject: "🎉 Welcome to X Invoice - Your Invoicing Journey Starts Here!",
      html: welcomeEmailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Welcome email sent successfully",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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