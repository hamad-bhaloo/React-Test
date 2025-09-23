
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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("Starting subscription check");
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not found in environment");
      throw new Error("Stripe configuration not found");
    }
    console.log("Stripe key found");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    console.log(`Checking subscription for user: ${user.email}`);

    const stripe = new Stripe(stripeSecretKey, { 
      apiVersion: "2023-10-16" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: 'Free',
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: 'Free',
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    console.log(`Found Stripe customer: ${customerId}`);
    
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10, // Get more subscriptions to debug
    });

    console.log(`Found ${subscriptions.data.length} active subscriptions`);
    subscriptions.data.forEach((sub, index) => {
      console.log(`Subscription ${index}: ${sub.id}, status: ${sub.status}`);
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = 'Free';
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      console.log(`Found active subscription: ${subscription.id}`);
      console.log(`Subscription metadata:`, JSON.stringify(subscription.metadata));
      
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      console.log(`Price details - ID: ${priceId}, Amount: ${amount}, Nickname: ${price.nickname || 'N/A'}`);
      console.log(`Product name: ${price.product}`);
      
      // Get the full product details
      const product = await stripe.products.retrieve(price.product as string);
      console.log(`Product details - Name: ${product.name}, Description: ${product.description}`);
      
      // Check subscription metadata first for plan information
      if (subscription.metadata.plan_name) {
        const planName = subscription.metadata.plan_name.toLowerCase();
        console.log(`Found plan name in metadata: ${planName}`);
        if (planName.includes('basic')) {
          subscriptionTier = "Basic";
        } else if (planName.includes('standard')) {
          subscriptionTier = "Standard";
        } else if (planName.includes('premium')) {
          subscriptionTier = "Premium";
        }
      }
      
      // If no tier from metadata, check product name
      if (subscriptionTier === 'Free' && product.name) {
        const productName = product.name.toLowerCase();
        console.log(`Checking product name: ${productName}`);
        if (productName.includes('basic')) {
          subscriptionTier = "Basic";
        } else if (productName.includes('standard')) {
          subscriptionTier = "Standard";
        } else if (productName.includes('premium')) {
          subscriptionTier = "Premium";
        }
      }
      
      // Fallback to amount-based detection
      if (subscriptionTier === 'Free') {
        console.log(`Falling back to amount-based detection: ${amount}`);
        if (amount === 999) {
          subscriptionTier = "Basic";
        } else if (amount === 2999) {
          subscriptionTier = "Standard";
        } else if (amount === 4999) {
          subscriptionTier = "Premium";
        }
      }
      
      console.log(`Final determined subscription tier: ${subscriptionTier}`);
    } else {
      console.log(`No active subscriptions found for customer: ${customerId}`);
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
