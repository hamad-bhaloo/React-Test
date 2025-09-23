import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      expense_categories: {
        Insert: {
          user_id: string
          name: string
          description?: string
          color?: string
          budget_limit?: number
          is_active?: boolean
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user already has categories
    const { data: existingCategories } = await supabaseClient
      .from('expense_categories')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (existingCategories && existingCategories.length > 0) {
      return new Response(JSON.stringify({ message: 'Categories already exist' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Default expense categories
    const defaultCategories = [
      { name: 'Office Supplies', description: 'Pens, paper, equipment', color: '#3b82f6' },
      { name: 'Marketing', description: 'Advertising, promotions, campaigns', color: '#f59e0b' },
      { name: 'Travel', description: 'Business trips, transportation', color: '#10b981' },
      { name: 'Software', description: 'Subscriptions, licenses, tools', color: '#8b5cf6' },
      { name: 'Utilities', description: 'Internet, phone, electricity', color: '#ef4444' },
      { name: 'Meals', description: 'Business meals, client entertainment', color: '#f97316' },
      { name: 'Equipment', description: 'Computers, furniture, machinery', color: '#6366f1' },
      { name: 'Professional Services', description: 'Legal, accounting, consulting', color: '#14b8a6' },
      { name: 'Rent', description: 'Office rent, storage space', color: '#84cc16' },
      { name: 'Miscellaneous', description: 'Other business expenses', color: '#64748b' }
    ]

    // Insert default categories
    const categoriesToInsert = defaultCategories.map(category => ({
      ...category,
      user_id: user.id,
      budget_limit: 0,
      is_active: true
    }))

    const { data, error } = await supabaseClient
      .from('expense_categories')
      .insert(categoriesToInsert)
      .select()

    if (error) {
      console.error('Error inserting categories:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      message: 'Default expense categories created successfully',
      categories: data 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})