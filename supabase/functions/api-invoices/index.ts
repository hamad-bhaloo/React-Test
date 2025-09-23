import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface ApiRequest {
  method: string;
  headers: Headers;
  url: string;
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
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Extract API key from header
    const apiKey = req.headers.get('x-api-key');
    const authHeader = req.headers.get('authorization');
    
    let userId: string | null = null;
    
    // API key authentication for external integrations
    if (apiKey) {
      const { data: apiKeyData } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('key_hash', apiKey)
        .eq('is_active', true)
        .single();
      
      if (!apiKeyData) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = apiKeyData.user_id;
    } else if (authHeader) {
      // JWT authentication for web app
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    } else {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const method = req.method;
    const resource = pathParts[0] || 'invoices';
    const resourceId = pathParts[1];

    switch (resource) {
      case 'invoices':
        return await handleInvoices(supabase, method, resourceId, req, userId);
      case 'clients':
        return await handleClients(supabase, method, resourceId, req, userId);
      case 'templates':
        return await handleTemplates(supabase, method, resourceId, req, userId);
      case 'analytics':
        return await handleAnalytics(supabase, method, req, userId);
      default:
        return new Response(JSON.stringify({ error: 'Resource not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleInvoices(supabase: any, method: string, resourceId: string | undefined, req: Request, userId: string) {
  switch (method) {
    case 'GET':
      if (resourceId) {
        // Get single invoice
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            clients (*),
            invoice_items (*)
          `)
          .eq('id', resourceId)
          .eq('user_id', userId)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Get all invoices with pagination
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
          .from('invoices')
          .select(`
            *,
            clients (name, email)
          `, { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          data,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    case 'POST':
      const invoiceData = await req.json();
      
      // Generate invoice number if not provided
      if (!invoiceData.invoice_number) {
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastNumber = lastInvoice?.[0]?.invoice_number?.match(/\d+$/)?.[0] || '0';
        invoiceData.invoice_number = `INV-${(parseInt(lastNumber) + 1).toString().padStart(4, '0')}`;
      }

      invoiceData.user_id = userId;
      
      const { data: newInvoice, error: createError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert invoice items if provided
      if (invoiceData.items && invoiceData.items.length > 0) {
        const items = invoiceData.items.map((item: any) => ({
          ...item,
          invoice_id: newInvoice.id
        }));

        await supabase.from('invoice_items').insert(items);
      }

      return new Response(JSON.stringify(newInvoice), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    case 'PUT':
      if (!resourceId) {
        return new Response(JSON.stringify({ error: 'Invoice ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updateData = await req.json();
      delete updateData.user_id; // Prevent user_id modification

      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', resourceId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(updatedInvoice), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    case 'DELETE':
      if (!resourceId) {
        return new Response(JSON.stringify({ error: 'Invoice ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', resourceId)
        .eq('user_id', userId);

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }
}

async function handleClients(supabase: any, method: string, resourceId: string | undefined, req: Request, userId: string) {
  switch (method) {
    case 'GET':
      if (resourceId) {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', resourceId)
          .eq('user_id', userId)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', userId)
          .order('name');

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    case 'POST':
      const clientData = await req.json();
      clientData.user_id = userId;
      
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(newClient), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }
}

async function handleTemplates(supabase: any, method: string, resourceId: string | undefined, req: Request, userId: string) {
  // Template handling logic would go here
  return new Response(JSON.stringify({ message: 'Templates endpoint coming soon' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleAnalytics(supabase: any, method: string, req: Request, userId: string) {
  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get basic analytics
  const { data: invoiceStats } = await supabase
    .from('invoices')
    .select('status, total_amount, payment_status')
    .eq('user_id', userId);

  const stats = {
    total_invoices: invoiceStats?.length || 0,
    total_revenue: invoiceStats?.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0) || 0,
    paid_invoices: invoiceStats?.filter((inv: any) => inv.payment_status === 'paid').length || 0,
    pending_invoices: invoiceStats?.filter((inv: any) => inv.payment_status === 'unpaid').length || 0,
  };

  return new Response(JSON.stringify(stats), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}