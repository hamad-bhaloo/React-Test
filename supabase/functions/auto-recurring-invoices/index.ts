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

  try {
    console.log("Starting auto-recurring invoices process");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Find recurring invoices that need to be generated
    const { data: recurringInvoices, error: fetchError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        clients(*),
        invoice_items(*)
      `)
      .eq('is_recurring', true)
      .lte('due_date', todayString)
      .eq('status', 'sent');

    if (fetchError) {
      console.error("Error fetching recurring invoices:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringInvoices?.length || 0} recurring invoices to process`);

    let processedCount = 0;

    for (const invoice of recurringInvoices || []) {
      try {
        // Calculate next due date based on frequency
        const currentDueDate = new Date(invoice.due_date);
        let nextDueDate = new Date(currentDueDate);
        
        switch (invoice.recurring_frequency) {
          case 'weekly':
            nextDueDate.setDate(nextDueDate.getDate() + 7);
            break;
          case 'monthly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
            break;
          default:
            nextDueDate.setMonth(nextDueDate.getMonth() + 1); // Default to monthly
        }

        // Check if we should stop recurring (if end date is reached)
        if (invoice.recurring_end_date && nextDueDate > new Date(invoice.recurring_end_date)) {
          console.log(`Recurring ended for invoice ${invoice.invoice_number}`);
          
          // Mark as non-recurring
          await supabaseClient
            .from('invoices')
            .update({ is_recurring: false })
            .eq('id', invoice.id);
          
          continue;
        }

        // Generate new invoice number
        const { data: lastInvoice } = await supabaseClient
          .from('invoices')
          .select('invoice_number')
          .eq('user_id', invoice.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let newInvoiceNumber;
        if (lastInvoice?.invoice_number) {
          const lastNumber = parseInt(lastInvoice.invoice_number.replace(/\D/g, '')) || 0;
          newInvoiceNumber = `INV-${(lastNumber + 1).toString().padStart(4, '0')}`;
        } else {
          newInvoiceNumber = 'INV-0001';
        }

        // Create new invoice
        const newInvoice = {
          user_id: invoice.user_id,
          client_id: invoice.client_id,
          invoice_number: newInvoiceNumber,
          issue_date: todayString,
          due_date: nextDueDate.toISOString().split('T')[0],
          currency: invoice.currency,
          subtotal: invoice.subtotal,
          tax_percentage: invoice.tax_percentage,
          tax_amount: invoice.tax_amount,
          discount_percentage: invoice.discount_percentage,
          discount_amount: invoice.discount_amount,
          shipping_charge: invoice.shipping_charge,
          total_amount: invoice.total_amount,
          notes: invoice.notes,
          terms: invoice.terms,
          status: 'draft', // Start as draft
          payment_status: 'unpaid',
          is_recurring: invoice.is_recurring,
          recurring_frequency: invoice.recurring_frequency,
          recurring_end_date: invoice.recurring_end_date,
          template_id: invoice.template_id,
          payment_methods_enabled: invoice.payment_methods_enabled
        };

        const { data: createdInvoice, error: createError } = await supabaseClient
          .from('invoices')
          .insert(newInvoice)
          .select()
          .single();

        if (createError) {
          console.error(`Error creating new invoice for ${invoice.invoice_number}:`, createError);
          continue;
        }

        // Copy invoice items
        const newItems = invoice.invoice_items.map((item: any) => ({
          invoice_id: createdInvoice.id,
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }));

        const { error: itemsError } = await supabaseClient
          .from('invoice_items')
          .insert(newItems);

        if (itemsError) {
          console.error(`Error creating invoice items for ${newInvoiceNumber}:`, itemsError);
          // Delete the invoice if items creation failed
          await supabaseClient
            .from('invoices')
            .delete()
            .eq('id', createdInvoice.id);
          continue;
        }

        // Update the original recurring invoice with next due date
        await supabaseClient
          .from('invoices')
          .update({ 
            due_date: nextDueDate.toISOString().split('T')[0]
          })
          .eq('id', invoice.id);

        console.log(`Created recurring invoice ${newInvoiceNumber} from ${invoice.invoice_number}`);
        processedCount++;

        // Optional: Send email notification (if you have email function)
        try {
          await supabaseClient.functions.invoke('send-invoice-email', {
            body: {
              invoiceId: createdInvoice.id,
              clientEmail: invoice.clients.email,
              type: 'recurring_invoice'
            }
          });
        } catch (emailError) {
          console.log(`Email notification failed for ${newInvoiceNumber}:`, emailError);
          // Don't fail the whole process if email fails
        }

      } catch (invoiceError) {
        console.error(`Error processing invoice ${invoice.invoice_number}:`, invoiceError);
        continue;
      }
    }

    console.log(`Successfully processed ${processedCount} recurring invoices`);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${processedCount} recurring invoices`,
      processedCount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in auto-recurring-invoices function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});