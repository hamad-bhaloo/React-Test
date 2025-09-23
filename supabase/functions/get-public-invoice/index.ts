import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { invoiceId, paymentLinkId } = await req.json();
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoiceId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paymentLinkId) {
      return new Response(JSON.stringify({ error: "paymentLinkId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invoice with secure token validation
    const { data: invoice, error: invError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        clients (
          id, name, first_name, last_name, email, company, phone, address, city, state, zip_code, country
        ),
        invoice_items (
          id, product_name, description, quantity, unit, rate, amount
        )
      `)
      .eq('id', invoiceId)
      .eq('payment_link_id', paymentLinkId)
      .maybeSingle();

    if (invError) {
      console.error('Error fetching invoice (service):', invError);
      throw invError;
    }

    if (!invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch company by user_id for header info
    let company = null;
    if (invoice.user_id) {
      const { data: companyData, error: compError } = await supabaseClient
        .from('companies')
        .select('id, name, description, logo_url, phone, email, address, city, state, zip_code, country, website, tax_id')
        .eq('user_id', invoice.user_id)
        .maybeSingle();

      if (!compError) {
        company = companyData;
      }
    }

    return new Response(JSON.stringify({ invoice, company }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('get-public-invoice error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});