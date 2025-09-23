import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-TEAM-INVITATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { invitationId } = await req.json();
    if (!invitationId) throw new Error("Invitation ID is required");

    // Fetch invitation details
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('team_invitations')
      .select(`
        *,
        companies!inner(name, email)
      `)
      .eq('id', invitationId)
      .single();

    if (inviteError || !invitation) {
      throw new Error("Invitation not found");
    }

    logStep("Invitation found", { invitationId, email: invitation.email });

    // Create invitation link
    const invitationUrl = `${req.headers.get("origin")}/accept-invitation/${invitation.invitation_token}`;

    // Email template
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Team Invitation - X Invoice</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                margin: 0; 
                padding: 0; 
                background-color: #f8f9fa;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 8px; 
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center;
            }
            .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: 700;
            }
            .content { 
                padding: 40px 30px; 
            }
            .invitation-box {
                background: #f8f9fa;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 24px;
                margin: 24px 0;
                text-align: center;
            }
            .company-name {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 8px;
            }
            .role-badge {
                display: inline-block;
                background: #ea580c;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin: 8px 0;
            }
            .cta-button { 
                display: inline-block; 
                background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: 600;
                margin: 20px 0;
                transition: all 0.2s ease;
            }
            .cta-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
            }
            .footer { 
                background: #1f2937; 
                color: white; 
                padding: 30px; 
                text-align: center; 
                font-size: 14px;
            }
            .features {
                display: flex;
                justify-content: space-around;
                margin: 30px 0;
                flex-wrap: wrap;
            }
            .feature {
                text-align: center;
                margin: 10px;
            }
            .feature-icon {
                width: 48px;
                height: 48px;
                background: #fef3e2;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 8px;
                font-size: 24px;
            }
            .alternative-link {
                word-break: break-all;
                color: #6b7280;
                font-size: 12px;
                margin-top: 20px;
                padding: 12px;
                background: #f9fafb;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧾 X Invoice</h1>
                <p style="margin: 8px 0 0; opacity: 0.9;">You're invited to join a team!</p>
            </div>
            
            <div class="content">
                <h2 style="color: #1f2937; margin-bottom: 16px;">Team Invitation</h2>
                
                <p>You've been invited to join <strong>${invitation.companies.name}</strong>'s team on X Invoice.</p>
                
                <div class="invitation-box">
                    <div class="company-name">${invitation.companies.name}</div>
                    <div class="role-badge">${invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}</div>
                    <p style="margin: 16px 0 0; color: #6b7280;">You'll be able to access and manage invoices, clients, and collaborate with the team.</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${invitationUrl}" class="cta-button">Accept Invitation</a>
                </div>
                
                <div class="features">
                    <div class="feature">
                        <div class="feature-icon">📊</div>
                        <p><strong>Manage Invoices</strong><br>Create and send invoices</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">👥</div>
                        <p><strong>Client Management</strong><br>Access client database</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🤝</div>
                        <p><strong>Team Collaboration</strong><br>Work together efficiently</p>
                    </div>
                </div>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                    This invitation will expire in 7 days. If you have any questions, contact the team admin.
                </p>
                
                <div class="alternative-link">
                    <strong>Having trouble with the button?</strong><br>
                    Copy and paste this link into your browser: <br>
                    ${invitationUrl}
                </div>
            </div>
            
            <div class="footer">
                <p style="margin: 0;">© ${new Date().getFullYear()} X Invoice. Professional invoicing made simple.</p>
                <p style="margin: 8px 0 0; opacity: 0.8;">This email was sent by X Invoice team invitation system.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Send email using Resend API
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "X Invoice <no-reply@xinvoice.app>",
        to: [invitation.email],
        subject: `Team Invitation: Join ${invitation.companies.name} on X Invoice`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      logStep("Email sending failed", { status: emailResponse.status, error: errorData });
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResult = await emailResponse.json();
    logStep("Email sent successfully", { emailId: emailResult.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation email sent successfully",
        emailId: emailResult.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});