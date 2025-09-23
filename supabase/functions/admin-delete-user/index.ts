import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create a Supabase client with the Auth context of the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Create admin client with service role for all operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user is authenticated
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('Checking admin role for user:', user.id)

    // Use admin client to check if user has admin role using RPC function
    const { data: hasAdminRole, error: roleError } = await supabaseAdmin
      .rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      })

    console.log('User has admin role:', hasAdminRole, 'Error:', roleError)

    if (roleError) {
      throw new Error(`Failed to check user role: ${roleError.message}`)
    }

    if (!hasAdminRole) {
      throw new Error('User not authorized - admin role required')
    }

    console.log('Admin authorization confirmed for user:', user.id)

    // Parse the request body
    const { userId, deleteAllData } = await req.json()

    if (deleteAllData) {
      // Delete all user-associated data
      const deletePromises = [
        supabaseAdmin.from('invoices').delete().eq('user_id', userId),
        supabaseAdmin.from('clients').delete().eq('user_id', userId),
        supabaseAdmin.from('quotations').delete().eq('user_id', userId),
        supabaseAdmin.from('expenses').delete().eq('user_id', userId),
        supabaseAdmin.from('companies').delete().eq('user_id', userId),
        supabaseAdmin.from('inventory_products').delete().eq('user_id', userId),
        supabaseAdmin.from('inventory_categories').delete().eq('user_id', userId),
        supabaseAdmin.from('expense_categories').delete().eq('user_id', userId),
        supabaseAdmin.from('pos_sales').delete().eq('user_id', userId),
        supabaseAdmin.from('purchase_orders').delete().eq('user_id', userId),
        supabaseAdmin.from('debt_collections').delete().eq('user_id', userId),
        supabaseAdmin.from('api_keys').delete().eq('user_id', userId),
        supabaseAdmin.from('payment_methods').delete().eq('user_id', userId),
        supabaseAdmin.from('payments').delete().eq('user_id', userId),
        supabaseAdmin.from('notifications').delete().eq('user_id', userId),
        supabaseAdmin.from('wallets').delete().eq('user_id', userId),
        supabaseAdmin.from('subscribers').delete().eq('user_id', userId),
        supabaseAdmin.from('team_members').delete().eq('user_id', userId),
      ]

      await Promise.allSettled(deletePromises)
    }

    // Delete user role
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)

    // Delete the auth user (this will cascade delete the profile)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (authError) {
      throw new Error(`Failed to delete user: ${authError.message}`)
    }

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in admin-delete-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})