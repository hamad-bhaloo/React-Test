import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ADMIN-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Use the service role key to create users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email, password, fullName } = await req.json();
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    logStep("Creating admin user", { email, fullName });

    // Create the user in auth.users using admin client
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || 'Admin User'
      }
    });

    if (userError) {
      logStep("Error creating user", userError);
      throw userError;
    }

    if (!userData.user) {
      throw new Error('Failed to create user');
    }

    logStep("User created successfully", { userId: userData.user.id });

    // Create admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: 'admin'
      });

    if (roleError) {
      logStep("Error creating admin role", roleError);
      // Don't throw here as the user is already created
      console.error('Failed to create admin role:', roleError);
    } else {
      logStep("Admin role created successfully");
    }

    // Create profile (this should be handled by the trigger, but let's ensure it exists)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userData.user.id,
        email: email,
        full_name: fullName || 'Admin User'
      });

    if (profileError) {
      logStep("Error creating profile", profileError);
      console.error('Failed to create profile:', profileError);
    } else {
      logStep("Profile created/updated successfully");
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        role: 'admin'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-admin-user", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});