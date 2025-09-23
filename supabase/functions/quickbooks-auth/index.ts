import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('QuickBooks auth action:', action, 'for user:', user.id);

    if (action === 'connect') {
      // QuickBooks OAuth 2.0 configuration
      const CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
      const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/quickbooks-callback`;
      const SCOPE = 'com.intuit.quickbooks.accounting';
      const STATE = `${user.id}_${Date.now()}`; // Include user ID in state for security

      if (!CLIENT_ID) {
        throw new Error('QuickBooks Client ID not configured');
      }

      // QuickBooks OAuth URL
      const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('scope', SCOPE);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('state', STATE);

      console.log('Generated QuickBooks auth URL:', authUrl.toString());

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );

  } catch (error) {
    console.error('QuickBooks auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});