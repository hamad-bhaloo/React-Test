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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const realmId = url.searchParams.get('realmId');
    const error = url.searchParams.get('error');

    console.log('QuickBooks callback received:', { code: !!code, state, realmId, error });

    if (error) {
      console.error('QuickBooks OAuth error:', error);
      return new Response(
        `<html><body><h1>Authorization Failed</h1><p>Error: ${error}</p><p><a href="/integrations">Return to Integrations</a></p></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !state || !realmId) {
      throw new Error('Missing required parameters');
    }

    // Extract user ID from state
    const userId = state.split('_')[0];
    if (!userId) {
      throw new Error('Invalid state parameter');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Exchange authorization code for access token
    const CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/quickbooks-callback`;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('QuickBooks credentials not configured');
    }

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange authorization code for tokens');
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful for user:', userId);

    // Store QuickBooks credentials in user settings
    const { error: updateError } = await supabaseClient
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings_data: {
          integrations: {
            quickbooks: {
              enabled: true,
              connected_at: new Date().toISOString(),
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              token_expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
              realm_id: realmId,
            }
          }
        }
      });

    if (updateError) {
      console.error('Error storing QuickBooks credentials:', updateError);
      throw updateError;
    }

    console.log('QuickBooks integration completed for user:', userId);

    // Redirect back to integrations page with success message
    return new Response(
      `<html><body>
        <h1>QuickBooks Connected Successfully!</h1>
        <p>Your QuickBooks account has been connected.</p>
        <script>
          setTimeout(() => {
            window.location.href = '/integrations';
          }, 2000);
        </script>
        <p><a href="/integrations">Return to Integrations</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('QuickBooks callback error:', error);
    return new Response(
      `<html><body>
        <h1>Connection Failed</h1>
        <p>Error: ${error.message}</p>
        <p><a href="/integrations">Return to Integrations</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
});