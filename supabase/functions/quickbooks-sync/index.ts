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

    console.log('QuickBooks sync action:', action, 'for user:', user.id);

    // Get QuickBooks credentials from user settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('settings_data')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings?.settings_data?.integrations?.quickbooks) {
      throw new Error('QuickBooks not connected. Please connect your account first.');
    }

    const qbConfig = settings.settings_data.integrations.quickbooks;
    
    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(qbConfig.token_expires_at);
    
    let accessToken = qbConfig.access_token;
    
    if (now >= expiresAt) {
      console.log('Refreshing QuickBooks access token...');
      accessToken = await refreshAccessToken(qbConfig.refresh_token, user.id, supabaseClient);
    }

    if (action === 'sync_all') {
      // Sync customers to clients
      await syncCustomers(accessToken, qbConfig.realm_id, user.id, supabaseClient);
      
      // Sync items/services
      await syncItems(accessToken, qbConfig.realm_id, user.id, supabaseClient);
      
      console.log('QuickBooks sync completed for user:', user.id);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Sync completed successfully' }),
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
    console.error('QuickBooks sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function refreshAccessToken(refreshToken: string, userId: string, supabaseClient: any): Promise<string> {
  const CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
  const CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');

  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const tokenData = await response.json();
  
  // Update stored tokens
  await supabaseClient
    .from('user_settings')
    .update({
      settings_data: {
        integrations: {
          quickbooks: {
            enabled: true,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
          }
        }
      }
    })
    .eq('user_id', userId);

  return tokenData.access_token;
}

async function syncCustomers(accessToken: string, realmId: string, userId: string, supabaseClient: any) {
  console.log('Syncing QuickBooks customers...');
  
  const response = await fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Customer`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch QuickBooks customers');
    return;
  }

  const data = await response.json();
  const customers = data.QueryResponse?.Customer || [];

  console.log(`Found ${customers.length} customers in QuickBooks`);

  for (const customer of customers) {
    try {
      // Map QuickBooks customer to our client format
      const clientData = {
        user_id: userId,
        name: customer.FullyQualifiedName || customer.Name,
        first_name: customer.GivenName || null,
        last_name: customer.FamilyName || null,
        company: customer.CompanyName || null,
        email: customer.PrimaryEmailAddr?.Address || null,
        phone: customer.PrimaryPhone?.FreeFormNumber || null,
        address: customer.BillAddr?.Line1 || null,
        city: customer.BillAddr?.City || null,
        state: customer.BillAddr?.CountrySubDivisionCode || null,
        zip_code: customer.BillAddr?.PostalCode || null,
        country: customer.BillAddr?.Country || null,
        client_type: 'individual',
        status: customer.Active ? 'active' : 'inactive',
        notes: `Synced from QuickBooks. QB ID: ${customer.Id}`,
      };

      // Check if client already exists
      const { data: existingClient } = await supabaseClient
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .eq('name', clientData.name)
        .maybeSingle();

      if (!existingClient) {
        await supabaseClient
          .from('clients')
          .insert(clientData);
        console.log(`Created client: ${clientData.name}`);
      } else {
        console.log(`Client already exists: ${clientData.name}`);
      }
    } catch (error) {
      console.error(`Error syncing customer ${customer.Name}:`, error);
    }
  }
}

async function syncItems(accessToken: string, realmId: string, userId: string, supabaseClient: any) {
  console.log('Syncing QuickBooks items...');
  
  const response = await fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Item WHERE Type IN ('Inventory', 'NonInventory', 'Service')`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch QuickBooks items');
    return;
  }

  const data = await response.json();
  const items = data.QueryResponse?.Item || [];

  console.log(`Found ${items.length} items in QuickBooks`);

  // Store items in user settings for use in invoice creation
  const { data: currentSettings } = await supabaseClient
    .from('user_settings')
    .select('settings_data')
    .eq('user_id', userId)
    .single();

  const updatedSettings = {
    ...currentSettings?.settings_data,
    quickbooks_items: items.map(item => ({
      id: item.Id,
      name: item.Name,
      description: item.Description || '',
      unit_price: item.UnitPrice || 0,
      type: item.Type,
      active: item.Active,
    }))
  };

  await supabaseClient
    .from('user_settings')
    .update({ settings_data: updatedSettings })
    .eq('user_id', userId);

  console.log('Items synced to user settings');
}