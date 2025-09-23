import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'trigger':
        return await triggerWebhook(supabase, req);
      case 'register':
        return await registerWebhook(supabase, req);
      case 'list':
        return await listWebhooks(supabase, req);
      case 'delete':
        return await deleteWebhook(supabase, req);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Webhook Handler Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function triggerWebhook(supabase: any, req: Request) {
  const { event, data, userId } = await req.json();
  
  console.log(`Triggering webhook for event: ${event}`);

  // Get all active webhook endpoints for this user and event
  const { data: webhooks, error: webhooksError } = await supabase
    .from('webhook_endpoints')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [event]);

  if (webhooksError) {
    console.error('Error fetching webhooks:', webhooksError);
    return new Response(JSON.stringify({ error: webhooksError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results = [];

  // Send webhook to each endpoint
  for (const webhook of webhooks || []) {
    try {
      const payload: WebhookPayload = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };

      // Create signature for security
      const signature = await createSignature(JSON.stringify(payload), webhook.secret);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        body: JSON.stringify(payload),
      });

      results.push({
        webhook_id: webhook.id,
        url: webhook.url,
        status: response.status,
        success: response.ok,
      });

      console.log(`Webhook ${webhook.id} sent to ${webhook.url}: ${response.status}`);

    } catch (error) {
      console.error(`Error sending webhook ${webhook.id}:`, error);
      results.push({
        webhook_id: webhook.id,
        url: webhook.url,
        status: 0,
        success: false,
        error: error.message,
      });
    }
  }

  return new Response(JSON.stringify({
    event,
    webhooks_sent: results.length,
    results
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function registerWebhook(supabase: any, req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { url, events } = await req.json();
  
  if (!url || !events || !Array.isArray(events)) {
    return new Response(JSON.stringify({ error: 'URL and events array are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate a secret for this webhook
  const secret = generateWebhookSecret();

  const { data: webhook, error } = await supabase
    .from('webhook_endpoints')
    .insert({
      user_id: user.id,
      url,
      events,
      secret,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    ...webhook,
    secret, // Only return secret on creation
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function listWebhooks(supabase: any, req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: webhooks, error } = await supabase
    .from('webhook_endpoints')
    .select('id, url, events, is_active, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(webhooks), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteWebhook(supabase: any, req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { webhookId } = await req.json();
  
  if (!webhookId) {
    return new Response(JSON.stringify({ error: 'Webhook ID is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error } = await supabase
    .from('webhook_endpoints')
    .delete()
    .eq('id', webhookId)
    .eq('user_id', user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function createSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}