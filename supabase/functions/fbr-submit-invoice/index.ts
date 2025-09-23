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

    const { invoiceId } = await req.json()

    if (!invoiceId) {
      throw new Error('Invoice ID is required')
    }

    console.log('Submitting invoice to FBR:', invoiceId, 'for user:', user.id)

    // Fetch invoice data with client and items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(*),
        invoice_items(*)
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found or access denied')
    }

    // Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (companyError) {
      console.error('Error fetching company:', companyError)
    }

    // Prepare FBR invoice data format
    const fbrInvoiceData = {
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      total_amount: invoice.total_amount,
      tax_amount: invoice.tax_amount,
      subtotal: invoice.subtotal,
      currency: invoice.currency,
      status: invoice.status,
      supplier: {
        name: company?.name || 'N/A',
        tax_id: company?.tax_id || '',
        registration_number: company?.registration_number || '',
        address: company?.address || '',
        email: company?.email || '',
        phone: company?.phone || ''
      },
      buyer: {
        name: invoice.clients?.name || 'N/A',
        email: invoice.clients?.email || '',
        phone: invoice.clients?.phone || '',
        address: invoice.clients?.address || '',
        tax_number: invoice.clients?.tax_number || ''
      },
      items: invoice.invoice_items?.map((item: any) => ({
        product_name: item.product_name,
        description: item.description || '',
        quantity: item.quantity,
        unit_price: item.rate,
        amount: item.amount,
        unit: item.unit || 'pcs'
      })) || [],
      tax_details: {
        tax_percentage: invoice.tax_percentage || 0,
        tax_amount: invoice.tax_amount || 0
      },
      metadata: {
        submitted_at: new Date().toISOString(),
        user_id: user.id,
        system: 'X-Invoice'
      }
    }

    const fbrApiKey = Deno.env.get('FBR_API_KEY')
    const fbrBaseUrl = Deno.env.get('FBR_BASE_URL')

    if (!fbrApiKey || !fbrBaseUrl) {
      throw new Error('FBR API credentials not configured')
    }

    // Submit to FBR
    const fbrResponse = await fetch(`${fbrBaseUrl}/api/v1/invoices/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fbrApiKey}`,
      },
      body: JSON.stringify(fbrInvoiceData)
    })

    if (!fbrResponse.ok) {
      const errorData = await fbrResponse.text()
      throw new Error(`FBR submission failed: ${fbrResponse.status} ${errorData}`)
    }

    const fbrResult = await fbrResponse.json()
    console.log('FBR submission result:', fbrResult)

    // Update invoice with FBR submission data
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status_history: [
          ...(invoice.status_history || []),
          {
            status: 'submitted_to_fbr',
            changed_at: new Date().toISOString(),
            changed_by: user.id,
            fbr_reference: fbrResult.reference_number || fbrResult.id,
            fbr_status: fbrResult.status || 'submitted'
          }
        ]
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice:', updateError)
    }

    // Store FBR submission log
    const { error: logError } = await supabase
      .from('fbr_submissions')
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        fbr_reference: fbrResult.reference_number || fbrResult.id,
        submission_status: fbrResult.status || 'submitted',
        submission_data: fbrInvoiceData,
        fbr_response: fbrResult,
        submitted_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging FBR submission:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invoice submitted to FBR successfully',
        fbr_reference: fbrResult.reference_number || fbrResult.id,
        fbr_status: fbrResult.status || 'submitted',
        submission_id: fbrResult.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('FBR submission error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to submit invoice to FBR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})