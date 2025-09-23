import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, userId }: SearchRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, let AI interpret the search query to understand intent
    const systemPrompt = `You are a search interpreter for an invoicing application. Analyze the user's natural language query and determine:

1. What they're looking for (clients, invoices, payments, companies)
2. Any specific criteria (dates, amounts, statuses, names)
3. Generate SQL-like conditions for filtering

Available data types:
- Clients: individual or organizational clients with names, emails, companies, industries
- Invoices: with statuses (draft, sent, viewed, paid), payment statuses (paid, unpaid, partially_paid), amounts, dates
- Payments: with amounts, dates, methods
- Companies: user's company information

Return a JSON object with:
{
  "intent": "search_type (clients|invoices|payments|companies|general)",
  "filters": {
    "table_specific_filters": "object with field names and values",
    "date_range": "if dates mentioned",
    "amount_range": "if amounts mentioned", 
    "status": "if status mentioned",
    "keywords": ["array", "of", "keywords", "for", "text", "search"]
  },
  "search_terms": "simplified search terms for fallback"
}

Examples:
"unpaid invoices from last month" -> {"intent": "invoices", "filters": {"payment_status": "unpaid", "date_range": "last_month"}}
"tech clients in NYC" -> {"intent": "clients", "filters": {"industry": "tech", "keywords": ["NYC", "New York"]}}
"large payments over $1000" -> {"intent": "payments", "filters": {"amount_range": {"min": 1000}}}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let searchIntent;

    try {
      searchIntent = JSON.parse(aiData.choices[0].message.content);
    } catch (parseError) {
      // Fallback to simple text search if AI parsing fails
      searchIntent = {
        intent: "general",
        filters: { keywords: [query] },
        search_terms: query
      };
    }

    // Execute search based on AI interpretation
    const results = [];

    // Search clients
    if (searchIntent.intent === 'clients' || searchIntent.intent === 'general') {
      let clientQuery = supabase
        .from('clients')
        .select('id, name, first_name, last_name, email, company, industry, phone')
        .eq('user_id', userId);

      if (searchIntent.filters.keywords) {
        const keywords = searchIntent.filters.keywords.join(' | ');
        clientQuery = clientQuery.or(`name.ilike.%${keywords}%,first_name.ilike.%${keywords}%,last_name.ilike.%${keywords}%,company.ilike.%${keywords}%,email.ilike.%${keywords}%,industry.ilike.%${keywords}%`);
      }

      const { data: clients } = await clientQuery.limit(10);
      
      if (clients) {
        results.push(...clients.map(client => ({
          id: client.id,
          type: 'client',
          title: client.name || `${client.first_name} ${client.last_name}` || client.company,
          subtitle: `${client.email || ''} ${client.company ? `• ${client.company}` : ''}`,
          url: `/clients?highlight=${client.id}`
        })));
      }
    }

    // Search invoices  
    if (searchIntent.intent === 'invoices' || searchIntent.intent === 'general') {
      let invoiceQuery = supabase
        .from('invoices')
        .select(`
          id, invoice_number, total_amount, status, payment_status, 
          issue_date, due_date,
          clients(name, first_name, last_name, company)
        `)
        .eq('user_id', userId);

      // Apply AI-interpreted filters
      if (searchIntent.filters.payment_status) {
        invoiceQuery = invoiceQuery.eq('payment_status', searchIntent.filters.payment_status);
      }
      if (searchIntent.filters.status) {
        invoiceQuery = invoiceQuery.eq('status', searchIntent.filters.status);
      }
      if (searchIntent.filters.amount_range?.min) {
        invoiceQuery = invoiceQuery.gte('total_amount', searchIntent.filters.amount_range.min);
      }
      if (searchIntent.filters.keywords) {
        const keywords = searchIntent.filters.keywords.join(' | ');
        invoiceQuery = invoiceQuery.ilike('invoice_number', `%${keywords}%`);
      }

      const { data: invoices } = await invoiceQuery.limit(10);
      
      if (invoices) {
        results.push(...invoices.map(invoice => ({
          id: invoice.id,
          type: 'invoice',
          title: `Invoice ${invoice.invoice_number}`,
          subtitle: `$${invoice.total_amount} • ${invoice.clients?.name || invoice.clients?.first_name + ' ' + invoice.clients?.last_name || invoice.clients?.company || 'No client'} • ${invoice.payment_status}`,
          url: `/invoices/${invoice.id}`
        })));
      }
    }

    // Search payments
    if (searchIntent.intent === 'payments' || searchIntent.intent === 'general') {
      let paymentQuery = supabase
        .from('payments')
        .select(`
          id, amount, payment_date, payment_method, notes,
          invoices(invoice_number, clients(name, first_name, last_name, company))
        `)
        .eq('user_id', userId);

      if (searchIntent.filters.amount_range?.min) {
        paymentQuery = paymentQuery.gte('amount', searchIntent.filters.amount_range.min);
      }
      if (searchIntent.filters.keywords) {
        const keywords = searchIntent.filters.keywords.join(' | ');
        paymentQuery = paymentQuery.or(`payment_method.ilike.%${keywords}%,notes.ilike.%${keywords}%`);
      }

      const { data: payments } = await paymentQuery.limit(10);
      
      if (payments) {
        results.push(...payments.map(payment => ({
          id: payment.id,
          type: 'payment',
          title: `Payment $${payment.amount}`,
          subtitle: `${payment.payment_method} • ${payment.payment_date} • ${payment.invoices?.clients?.name || 'No client'}`,
          url: `/payments?highlight=${payment.id}`
        })));
      }
    }

    return new Response(JSON.stringify({ 
      results,
      intent: searchIntent.intent,
      interpretation: searchIntent.filters
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-enhanced-search function:', error);
    return new Response(JSON.stringify({ 
      error: 'Search failed',
      details: error.message,
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});