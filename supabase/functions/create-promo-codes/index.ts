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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    const plans = [
      { name: "Basic", price: 799 },
      { name: "Standard", price: 1999 },
      { name: "Premium", price: 3999 }
    ];

    const discountPeriods = [
      { 
        suffix: "1MONTH", 
        duration_months: 1, 
        expires_days: 365, 
        name: "1 Month Free",
        percent_off: 100 
      },
      { 
        suffix: "6MONTHS", 
        duration_months: 6, 
        expires_days: 365, 
        name: "6 Months Free",
        percent_off: 100 
      },
      { 
        suffix: "2024", 
        duration_months: 12, 
        expires_days: 365, 
        name: "1 Year Free",
        percent_off: 100 
      }
    ];

    const promoCodes = [];

    for (const plan of plans) {
      for (const period of discountPeriods) {
        // Create a coupon with specified discount
        const coupon = await stripe.coupons.create({
          percent_off: period.percent_off,
          duration: "once",
          name: `${period.percent_off}% OFF ${plan.name} Plan - ${period.name} Promo`,
          metadata: {
            plan_name: plan.name,
            created_by: user.id,
            valid_for: `${period.duration_months}_months`,
            discount_period: period.name
          }
        });

        // Create a promotion code for the coupon
        const promoCode = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: `FREE${plan.name.toUpperCase()}${period.suffix}`,
          expires_at: Math.floor(Date.now() / 1000) + (period.expires_days * 24 * 60 * 60),
          max_redemptions: 1000, // Limit total redemptions
          metadata: {
            plan_name: plan.name,
            discount_type: `${period.percent_off}_percent_off`,
            discount_period: period.name,
            duration_months: period.duration_months.toString(),
            valid_until: new Date(Date.now() + (period.expires_days * 24 * 60 * 60 * 1000)).toISOString()
          }
        });

        promoCodes.push({
          plan: plan.name,
          code: promoCode.code,
          coupon_id: coupon.id,
          promo_code_id: promoCode.id,
          expires_at: new Date(promoCode.expires_at * 1000).toISOString(),
          max_redemptions: promoCode.max_redemptions,
          percent_off: period.percent_off,
          discount_period: period.name,
          duration_months: period.duration_months
        });
      }
    }

    console.log(`Created ${promoCodes.length} promo codes for user ${user.email}`);

    return new Response(JSON.stringify({ 
      success: true,
      promo_codes: promoCodes,
      message: `Successfully created ${promoCodes.length} promotional codes with 100% off for 1 month, 6 months, and 1 year periods`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating promo codes:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});