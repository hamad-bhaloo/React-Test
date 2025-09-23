import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT token
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    const { action } = await req.json()

    console.log('FBR setup action:', action, 'for user:', user.id)

    if (action === 'validate') {
      // Validate FBR API credentials
      const fbrApiKey = Deno.env.get('FBR_API_KEY')
      const fbrBaseUrl = Deno.env.get('FBR_BASE_URL')

      if (!fbrApiKey || !fbrBaseUrl) {
        throw new Error('FBR API credentials not configured')
      }

      // Test FBR API connection
      try {
        const response = await fetch(`${fbrBaseUrl}/api/v1/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fbrApiKey}`,
          },
          body: JSON.stringify({
            test: true
          })
        })

        if (!response.ok) {
          throw new Error('FBR API validation failed')
        }

        const result = await response.json()
        console.log('FBR validation result:', result)

        // Store FBR integration settings for user
        const { error: updateError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            settings_data: {
              integrations: {
                fbr: {
                  enabled: true,
                  connected_at: new Date().toISOString(),
                  status: 'active'
                }
              }
            }
          })

        if (updateError) {
          console.error('Error updating user settings:', updateError)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'FBR integration validated successfully',
            status: result.status || 'connected'
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      } catch (fbrError) {
        console.error('FBR validation error:', fbrError)
        throw new Error('Failed to validate FBR connection: ' + fbrError.message)
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('FBR setup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})