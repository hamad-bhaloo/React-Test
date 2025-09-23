import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, paymentLinkId } = await req.json();
    
    if (!invoiceId || !paymentLinkId) {
      return new Response(
        JSON.stringify({ error: 'Missing invoiceId or paymentLinkId' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // First fetch the invoice
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('payment_link_id', paymentLinkId)
      .maybeSingle();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Then fetch the user's profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('crypto_wallet_address')
      .eq('id', invoice.user_id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if crypto wallet is configured
    if (!profile?.crypto_wallet_address) {
      return new Response(
        JSON.stringify({ error: 'Crypto wallet not configured for this merchant' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'NOWPayments API key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create NOWPayments payment request
    const nowPaymentsPayload = {
      price_amount: invoice.total_amount,
      price_currency: invoice.currency || 'USD',
      pay_currency: 'btc', // Default to Bitcoin, could be made configurable
      ipn_callback_url: `${Deno.env.get('PUBLIC_APP_URL')}/api/nowpayments-webhook`,
      order_id: invoice.id,
      order_description: `Invoice ${invoice.invoice_number}`,
      success_url: `${Deno.env.get('PUBLIC_APP_URL')}/payment-success?invoice=${invoice.id}`,
      cancel_url: `${Deno.env.get('PUBLIC_APP_URL')}/invoice/${invoice.payment_link_id}`,
    };

    console.log('Creating NOWPayments payment:', nowPaymentsPayload);

    const nowPaymentsResponse = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nowPaymentsPayload),
    });

    const nowPaymentsData = await nowPaymentsResponse.json();
    
    if (!nowPaymentsResponse.ok) {
      console.error('NOWPayments API error:', nowPaymentsData);
      return new Response(
        JSON.stringify({ error: 'Failed to create crypto payment', details: nowPaymentsData }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('NOWPayments response:', nowPaymentsData);

    return new Response(
      JSON.stringify({
        payment_id: nowPaymentsData.payment_id,
        payment_status: nowPaymentsData.payment_status,
        pay_address: nowPaymentsData.pay_address,
        pay_amount: nowPaymentsData.pay_amount,
        pay_currency: nowPaymentsData.pay_currency,
        price_amount: nowPaymentsData.price_amount,
        price_currency: nowPaymentsData.price_currency,
        payment_url: nowPaymentsData.invoice_url || null,
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create crypto payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});