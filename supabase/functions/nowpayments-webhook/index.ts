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
    const webhookData = await req.json();
    console.log('NOWPayments webhook received:', webhookData);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { payment_id, payment_status, order_id, pay_amount, actually_paid } = webhookData;

    if (!order_id) {
      console.error('No order_id in webhook data');
      return new Response(
        JSON.stringify({ error: 'No order_id provided' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update invoice based on payment status
    let updateData: any = {};
    
    switch (payment_status) {
      case 'waiting':
        updateData = { payment_status: 'pending' };
        break;
      case 'confirming':
        updateData = { payment_status: 'pending' };
        break;
      case 'confirmed':
      case 'sending':
      case 'finished':
        updateData = { 
          payment_status: 'paid',
          status: 'paid',
          paid_amount: actually_paid || pay_amount
        };
        break;
      case 'failed':
      case 'refunded':
      case 'expired':
        updateData = { payment_status: 'failed' };
        break;
      default:
        console.log(`Unknown payment status: ${payment_status}`);
        updateData = { payment_status: 'pending' };
    }

    console.log(`Updating invoice ${order_id} with status: ${payment_status}`, updateData);

    // Update invoice status
    const { error: updateError } = await supabaseClient
      .from('invoices')
      .update(updateData)
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update invoice' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record payment if confirmed
    if (['confirmed', 'sending', 'finished'].includes(payment_status)) {
      const { data: invoice } = await supabaseClient
        .from('invoices')
        .select('user_id, total_amount')
        .eq('id', order_id)
        .maybeSingle();

      if (invoice) {
        const { error: paymentError } = await supabaseClient
          .from('payments')
          .insert({
            invoice_id: order_id,
            user_id: invoice.user_id,
            amount: actually_paid || pay_amount || invoice.total_amount,
            payment_method: 'crypto',
            payment_date: new Date().toISOString().split('T')[0],
            notes: `Crypto payment via NOWPayments - Payment ID: ${payment_id}`
          });

        if (paymentError) {
          console.error('Error recording payment:', paymentError);
        }
      }
    }

    console.log(`Successfully processed webhook for invoice ${order_id}`);

    return new Response(
      JSON.stringify({ success: true }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('NOWPayments webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});