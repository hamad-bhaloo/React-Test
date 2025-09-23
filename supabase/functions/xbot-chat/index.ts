import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  userData: {
    totalInvoices: number;
    totalClients: number;
    totalRevenue: number;
    pendingPayments: number;
    recentInvoices: any[];
    recentPayments: any[];
  } | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userData }: ChatRequest = await req.json();

    // Create context from user data
    const context = userData ? `
Current user statistics:
- Total invoices: ${userData.totalInvoices}
- Total clients: ${userData.totalClients}
- Total revenue: $${userData.totalRevenue?.toFixed(2) || '0.00'}
- Pending payments: $${userData.pendingPayments?.toFixed(2) || '0.00'}
- Recent invoices: ${userData.recentInvoices?.length || 0} invoices
- Recent payments: ${userData.recentPayments?.length || 0} payments

Recent invoice details:
${userData.recentInvoices?.slice(0, 3).map(inv => 
  `- Invoice #${inv.invoice_number}: $${inv.total_amount} (${inv.payment_status})`
).join('\n') || 'No recent invoices'}
    ` : 'No user data available.';

    const systemPrompt = `You are XBot, a friendly and helpful AI assistant for the X-Invoice platform. You help users with their invoicing, payment tracking, client management, and general platform questions.

Key guidelines:
- Always be conversational, professional, and concise
- Provide specific information based on the user's actual data when available
- Offer step-by-step guidance when appropriate
- Focus only on the current user's data - never reference other users
- If asked about features not visible in the data, provide general guidance about the platform
- For urgent payment issues, suggest checking the debt collection features
- Always maintain user privacy and data security

Current user context:
${context}

Respond in a helpful, personal way based on their actual data and question.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: botResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in xbot-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});