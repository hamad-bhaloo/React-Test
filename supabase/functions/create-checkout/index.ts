
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { planName, planPrice, mode = "subscription", invoiceId, promoCode } = await req.json();
    
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Handle promo code for 100% discount
    let discountAmount = 0;
    let couponId = null;
    
    if (promoCode && mode === "subscription") {
      console.log(`Processing promo code: ${promoCode}`);
      
      // Define all valid promo codes with their durations
      const promoCodeMappings = {
        // 1 Month Free codes
        'FREEBASIC1MONTH': { duration_months: 1, plan: 'Basic' },
        'FREESTANDARD1MONTH': { duration_months: 1, plan: 'Standard' },
        'FREEPREMIUM1MONTH': { duration_months: 1, plan: 'Premium' },
        
        // 6 Months Free codes
        'FREEBASIC6MONTHS': { duration_months: 6, plan: 'Basic' },
        'FREESTANDARD6MONTHS': { duration_months: 6, plan: 'Standard' },
        'FREEPREMIUM6MONTHS': { duration_months: 6, plan: 'Premium' },
        
        // 1 Year Free codes (legacy)
        'FREEBASIC2024': { duration_months: 12, plan: 'Basic' },
        'FREESTANDARD2024': { duration_months: 12, plan: 'Standard' },
        'FREEPREMIUM2024': { duration_months: 12, plan: 'Premium' }
      };
      
      const promoInfo = promoCodeMappings[promoCode.toUpperCase()];
      
      if (promoInfo) {
        console.log(`Valid promo code found: ${promoCode}, Duration: ${promoInfo.duration_months} months, Plan: ${promoInfo.plan}`);
        
        // Create a 100% off coupon with the specified duration
        const coupon = await stripe.coupons.create({
          percent_off: 100,
          duration: 'repeating',
          duration_in_months: promoInfo.duration_months,
          name: `${promoInfo.duration_months}mo free - ${promoCode.slice(0, 15)}`
        });
        couponId = coupon.id;
        discountAmount = planPrice;
        
        console.log(`Created coupon: ${couponId} for ${promoInfo.duration_months} months`);
      } else {
        console.log(`Invalid promo code: ${promoCode}`);
      }
    }

    let sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: planName,
              description: mode === "payment" ? "Invoice Payment" : `${planName} subscription plan`
            },
            unit_amount: Math.round(planPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-cancel`,
      metadata: {
        plan_name: planName,
        user_id: user.id,
        promo_code: promoCode || '',
        discount_applied: discountAmount.toString(),
      },
      subscription_data: {
        metadata: {
          plan_name: planName,
          user_id: user.id,
        }
      },
    };

    // Apply coupon if valid promo code was used
    if (couponId) {
      sessionConfig.discounts = [{ coupon: couponId }];
    }

    // Add recurring configuration for subscriptions
    if (mode === "subscription") {
      sessionConfig.line_items[0].price_data.recurring = { interval: "month" };
    }

    // Add invoice metadata for payments
    if (mode === "payment" && invoiceId) {
      sessionConfig.metadata.invoice_id = invoiceId;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
