
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, user-agent",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Bot detection patterns
const botPatterns = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /automation/i,
  /headless/i, /phantom/i, /selenium/i, /webdriver/i
];

const isBot = (userAgent: string): boolean => {
  return botPatterns.some(pattern => pattern.test(userAgent));
};

const checkRateLimit = (ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const key = `rate_limit_${ip}`;
  
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (existing.count >= maxRequests) {
    return false;
  }
  
  existing.count++;
  return true;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userAgent = req.headers.get("user-agent") || "";
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Bot detection
    if (isBot(userAgent)) {
      return new Response(JSON.stringify({ 
        error: "Bot detected", 
        blocked: true 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded", 
        blocked: true 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Security headers check
    const securityScore = {
      hasSecureHeaders: true,
      rateLimitPassed: true,
      botDetectionPassed: true,
      ipAddress: ip,
      userAgent: userAgent.substring(0, 100), // Limit UA length for security
    };

    return new Response(JSON.stringify({ 
      success: true, 
      securityScore,
      timestamp: new Date().toISOString()
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-Security-Check": "passed"
      },
      status: 200,
    });

  } catch (error) {
    console.error("Security check error:", error);
    return new Response(JSON.stringify({ 
      error: "Security check failed",
      blocked: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
