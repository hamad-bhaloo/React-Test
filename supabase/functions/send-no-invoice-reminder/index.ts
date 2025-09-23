import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date references
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all users who might need reminders
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .lt('created_at', threeDaysAgo.toISOString());

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    let emailsSent = 0;
    let usersProcessed = 0;

    for (const profile of profiles || []) {
      try {
        usersProcessed++;
        
        // Check if user has created any invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('id')
          .eq('user_id', profile.id)
          .limit(1);

        if (invoicesError) {
          console.error(`Error checking invoices for user ${profile.id}:`, invoicesError);
          continue;
        }

        // Skip if user has already created invoices
        if (invoices && invoices.length > 0) {
          continue;
        }

        // Calculate user age
        const userCreatedAt = new Date(profile.created_at);
        const daysSinceRegistration = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 3600 * 24));

        // Check what reminders have already been sent
        const { data: reminderLogs, error: reminderError } = await supabase
          .from('user_reminder_logs')
          .select('reminder_type, sent_at')
          .eq('user_id', profile.id)
          .order('sent_at', { ascending: false });

        if (reminderError) {
          console.error(`Error checking reminder logs for user ${profile.id}:`, reminderError);
          continue;
        }

        // Determine what reminder to send based on exact day matches (not daily)
        let reminderType = null;
        let shouldSend = false;

        const sentTypes = new Set(reminderLogs?.map(log => log.reminder_type) || []);

        // Only send reminders on specific days, not every day after the threshold
        if (daysSinceRegistration >= 30) {
          // Monthly marketing emails (send if last monthly was over 30 days ago)
          const lastMonthly = reminderLogs?.find(log => log.reminder_type === 'monthly_marketing');
          if (!lastMonthly || (now.getTime() - new Date(lastMonthly.sent_at).getTime()) > (30 * 24 * 60 * 60 * 1000)) {
            reminderType = 'monthly_marketing';
            shouldSend = true;
          }
        } else if (daysSinceRegistration === 7 && !sentTypes.has('no_invoice_7d')) {
          // Only send on exactly day 7
          reminderType = 'no_invoice_7d';
          shouldSend = true;
        } else if (daysSinceRegistration === 5 && !sentTypes.has('no_invoice_5d')) {
          // Only send on exactly day 5
          reminderType = 'no_invoice_5d';  
          shouldSend = true;
        } else if (daysSinceRegistration === 3 && !sentTypes.has('no_invoice_3d')) {
          // Only send on exactly day 3
          reminderType = 'no_invoice_3d';
          shouldSend = true;
        }

        if (!shouldSend || !reminderType) {
          continue;
        }

        // Get email content based on reminder type
        const emailContent = getEmailContent(reminderType, profile, daysSinceRegistration);
        
        // Send reminder email

        const emailResponse = await resend.emails.send({
          from: "X Invoice <reminders@xinvoice.app>",
          to: [profile.email],
          subject: emailContent.subject,
          html: emailContent.html,
        });

        // Log the reminder send
        await supabase
          .from('user_reminder_logs')
          .insert({
            user_id: profile.id,
            reminder_type: reminderType,
            email_sent: true,
            sent_at: now.toISOString()
          });

        console.log(`${reminderType} reminder sent to ${profile.email} (${daysSinceRegistration} days since registration):`, emailResponse);
        emailsSent++;
      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
        
        // Log failed send
        try {
          await supabase
            .from('user_reminder_logs')
            .insert({
              user_id: profile.id,
              reminder_type: reminderType || 'unknown',
              email_sent: false,
              email_error: userError.message,
              sent_at: now.toISOString()
            });
        } catch (logError) {
          console.error('Failed to log error:', logError);
        }
        continue;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Progressive reminder system processed successfully`,
      emailsSent,
      usersProcessed,
      totalUsers: profiles?.length || 0
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in no-invoice reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Email content generator function
function getEmailContent(reminderType: string, profile: any, daysSinceRegistration: number) {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    margin: 0; padding: 0; background-color: #f8fafc;
  `;

  switch (reminderType) {
    case 'no_invoice_3d':
      return {
        subject: "🚀 Ready to Create Your First Invoice? Let's Get Started!",
        html: getFirstReminderHTML(profile)
      };
    
    case 'no_invoice_5d':
      return {
        subject: "💡 Still Need Help Creating Your First Invoice?",
        html: getSecondReminderHTML(profile)
      };
    
    case 'no_invoice_7d':
      return {
        subject: "🎯 Don't Miss Out - Create Your First Invoice Today!",
        html: getThirdReminderHTML(profile)
      };
    
    case 'monthly_marketing':
      return {
        subject: "🌟 New X Invoice Features & Invoice Management Tips",
        html: getMonthlyMarketingHTML(profile)
      };
    
    default:
      return {
        subject: "🚀 Ready to Create Your First Invoice?",
        html: getFirstReminderHTML(profile)
      };
  }
}

function getFirstReminderHTML(profile: any) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ready to Create Your First Invoice?</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
          <div style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: #3b82f6; font-size: 28px; font-weight: bold;">X</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Ready to Get Started?</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Your first invoice is just moments away</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Hi${profile.full_name ? ` ${profile.full_name}` : ''}! 👋
          </h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
            It's been 3 days since you joined <strong style="color: #3b82f6;">X Invoice</strong>, 
            and we noticed you haven't created your first invoice yet. Don't worry - we're here to help!
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${Deno.env.get('PUBLIC_APP_URL')}/create-invoice" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                      color: #ffffff; 
                      padding: 16px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: 600; 
                      font-size: 16px;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Create My First Invoice
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 30px; text-align: center;">
          <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
            <strong style="color: #ffffff;">X Invoice</strong> - Professional Invoice Management
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getSecondReminderHTML(profile: any) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Still Need Help?</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
          <div style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: #f59e0b; font-size: 28px; font-weight: bold;">X</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Need Some Help?</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">We're here to support you</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Hi${profile.full_name ? ` ${profile.full_name}` : ''}! 💡
          </h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
            We noticed you still haven't created your first invoice. That's totally okay! 
            Many users find it helpful to start with our guided tutorial.
          </p>

          <!-- Step by Step -->
          <div style="background-color: #f0f9ff; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Quick Start Guide:</h3>
            <div style="color: #4b5563; line-height: 1.8;">
              <p>✅ Add your company details<br>
              ✅ Create your first client<br>
              ✅ Generate your invoice<br>
              ✅ Send and get paid!</p>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${Deno.env.get('PUBLIC_APP_URL')}/create-invoice" 
               style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                      color: #ffffff; 
                      padding: 16px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: 600; 
                      font-size: 16px;">
              Start Creating Invoice
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 30px; text-align: center;">
          <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
            <strong style="color: #ffffff;">X Invoice</strong> - Professional Invoice Management
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getThirdReminderHTML(profile: any) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Don't Miss Out!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
          <div style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: #ef4444; font-size: 28px; font-weight: bold;">X</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Don't Miss Out!</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Last chance to get started easily</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Hi${profile.full_name ? ` ${profile.full_name}` : ''}! 🎯
          </h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
            It's been a week since you joined X Invoice. Don't let this opportunity slip away! 
            Start invoicing professionally today and take control of your business finances.
          </p>

          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">⚡ Why Start Now?</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Get paid 30% faster with professional invoices</li>
              <li>Track all payments in one organized place</li>
              <li>Automate reminders and save time</li>
              <li>Build trust with professional branding</li>
            </ul>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${Deno.env.get('PUBLIC_APP_URL')}/create-invoice" 
               style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                      color: #ffffff; 
                      padding: 16px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: 600; 
                      font-size: 16px;">
              Create Invoice Now
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 30px; text-align: center;">
          <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
            <strong style="color: #ffffff;">X Invoice</strong> - Professional Invoice Management
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getMonthlyMarketingHTML(profile: any) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Features & Tips</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center;">
          <div style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: #8b5cf6; font-size: 28px; font-weight: bold;">X</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">What's New at X Invoice</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Features, tips, and invoice success stories</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Hi${profile.full_name ? ` ${profile.full_name}` : ''}! 🌟
          </h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
            We've been busy adding new features to make invoicing even easier for you. 
            Here's what's new and some tips to help grow your business!
          </p>

          <!-- Features Section -->
          <div style="background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #0288d1;">
            <h3 style="color: #01579b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🚀 New Features:</h3>
            <ul style="color: #01579b; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>AI Invoice Generator:</strong> Create invoices from descriptions</li>
              <li><strong>Multiple Payment Options:</strong> Crypto, cards, and digital wallets</li>
              <li><strong>Advanced Analytics:</strong> Track your business performance</li>
              <li><strong>Team Collaboration:</strong> Work with your team members</li>
            </ul>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${Deno.env.get('PUBLIC_APP_URL')}/dashboard" 
               style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
                      color: #ffffff; 
                      padding: 16px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: 600; 
                      font-size: 16px;">
              Explore New Features
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
            Ready to take your invoicing to the next level? Start exploring these new features today!
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 30px; text-align: center;">
          <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
            <strong style="color: #ffffff;">X Invoice</strong> - Professional Invoice Management
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);