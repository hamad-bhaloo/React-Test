import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useInvoices = (filters?: {
  status?: string;
  paymentStatus?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  invoiceType?: string;
}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['invoices', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for fetching invoices');
        return [];
      }
      
      console.log('Fetching invoices for user:', user.id);
      
      // First, get POS invoice IDs if we need to filter
      let posInvoiceIds: string[] = [];
      if (filters?.invoiceType === 'regular') {
        const { data: posData } = await supabase
          .from('pos_sales')
          .select('invoice_id')
          .not('invoice_id', 'is', null);
        
        posInvoiceIds = posData?.map(sale => sale.invoice_id).filter(Boolean) || [];
      }

      let query = supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            name,
            first_name,
            last_name,
            email,
            company,
            phone,
            address,
            city,
            state,
            zip_code,
            country
          ),
          invoice_items (
            id,
            product_name,
            description,
            quantity,
            rate,
            amount
          ),
          payments (
            id,
            amount,
            payment_date,
            payment_method
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Handle invoice type filtering
      if (filters?.invoiceType === 'pos') {
        // Only get invoices that exist in pos_sales
        if (posInvoiceIds.length === 0) {
          const { data: posData } = await supabase
            .from('pos_sales')
            .select('invoice_id')
            .not('invoice_id', 'is', null);
          
          posInvoiceIds = posData?.map(sale => sale.invoice_id).filter(Boolean) || [];
        }
        
        if (posInvoiceIds.length > 0) {
          query = query.in('id', posInvoiceIds);
        } else {
          // No POS invoices exist
          return [];
        }
      } else if (filters?.invoiceType === 'regular') {
        // Exclude POS invoices
        if (posInvoiceIds.length > 0) {
          query = query.not('id', 'in', `(${posInvoiceIds.join(',')})`);
        }
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus);
      }
      
      if (filters?.search) {
        query = query.or(`invoice_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('issue_date', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('issue_date', filters.dateTo);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }
      
      console.log('Successfully fetched invoices:', data?.length);
      return data || [];
    },
    enabled: !!user?.id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useInvoice = (invoiceId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['invoice', invoiceId, user?.id],
    queryFn: async () => {
      console.log('useInvoice hook called with:', { invoiceId, userId: user?.id });
      
      if (!user?.id) {
        console.log('No user ID available');
        throw new Error('User not authenticated');
      }
      
      if (!invoiceId) {
        console.log('No invoice ID provided');
        throw new Error('Invoice ID is required');
      }
      
      console.log('Fetching single invoice:', invoiceId);
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            name,
            first_name,
            last_name,
            email,
            company,
            phone,
            address,
            city,
            state,
            zip_code,
            country
          ),
          invoice_items (
            id,
            product_name,
            description,
            quantity,
            rate,
            amount
          ),
          payments (
            id,
            amount,
            payment_date,
            payment_method
          )
        `)
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching invoice:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Invoice not found');
        }
        throw error;
      }
      
      console.log('Successfully fetched invoice:', data);
      return data;
    },
    enabled: !!user?.id && !!invoiceId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (invoiceData: any) => {
      if (!user) throw new Error('User not authenticated');

      console.log('Starting invoice creation process...');
      console.log('Raw invoice data:', JSON.stringify(invoiceData, null, 2));
      
      const { invoice_items, ...invoice } = invoiceData;
      
      // Clean the invoice data - remove any undefined values and ensure proper types
      const cleanInvoice = {
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        currency: invoice.currency || 'USD',
        tax_percentage: Number(invoice.tax_percentage) || 0,
        discount_percentage: Number(invoice.discount_percentage) || 0,
        shipping_charge: Number(invoice.shipping_charge) || 0,
        notes: invoice.notes || null,
        terms: invoice.terms || null,
        is_recurring: Boolean(invoice.is_recurring),
        recurring_frequency: invoice.is_recurring ? invoice.recurring_frequency : null,
        recurring_end_date: invoice.is_recurring && invoice.recurring_end_date ? invoice.recurring_end_date : null,
        subtotal: Number(invoice.subtotal) || 0,
        discount_amount: Number(invoice.discount_amount) || 0,
        tax_amount: Number(invoice.tax_amount) || 0,
        total_amount: Number(invoice.total_amount) || 0,
        status: invoice.status || 'draft',
        payment_status: invoice.payment_status || 'unpaid',
        template_id: invoice.template_id || 1,
        user_id: user.id
      };
      
      console.log('Cleaned invoice data:', JSON.stringify(cleanInvoice, null, 2));
      
      // Start a transaction by creating the invoice first
      const { data: invoiceResult, error: invoiceError } = await supabase
        .from('invoices')
        .insert(cleanInvoice)
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        console.error('Error details:', JSON.stringify(invoiceError, null, 2));
        
        // Handle specific error cases
        if (invoiceError.code === '23505' && invoiceError.message?.includes('invoice_number')) {
          throw new Error('An invoice with this number already exists. Please try again.');
        }
        
        throw new Error(invoiceError.message || 'Failed to create invoice');
      }

      console.log('Invoice created successfully:', invoiceResult);

      // Create invoice items only after invoice is successfully created
      if (invoice_items && invoice_items.length > 0) {
        const cleanItems = invoice_items.map((item: any) => ({
          invoice_id: invoiceResult.id,
          product_name: item.product_name,
          description: item.description || null,
          quantity: Number(item.quantity) || 1,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
        }));

        console.log('Creating invoice items:', JSON.stringify(cleanItems, null, 2));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(cleanItems);

        if (itemsError) {
          console.error('Invoice items creation error:', itemsError);
          console.error('Items error details:', JSON.stringify(itemsError, null, 2));
          
          // If items creation fails, we should delete the invoice to maintain consistency
          await supabase
            .from('invoices')
            .delete()
            .eq('id', invoiceResult.id);
            
          throw new Error(itemsError.message || 'Failed to create invoice items');
        }

        console.log('Invoice items created successfully');
      }

      console.log('Invoice and items created successfully');
      return invoiceResult;
    },
    onSuccess: (data) => {
      console.log('Invoice creation mutation succeeded:', data);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Invoice created successfully!');
    },
    onError: (error: any) => {
      console.error('Invoice creation mutation failed:', error);
      const errorMessage = error.message || 'Failed to create invoice. Please try again.';
      toast.error(errorMessage);
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { invoice_items, ...invoice } = data;

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update(invoice)
        .eq('id', id);

      if (invoiceError) throw invoiceError;

      // Update invoice items if provided
      if (invoice_items) {
        // Delete existing items
        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id);

        // Insert new items
        if (invoice_items.length > 0) {
          const itemsWithInvoiceId = invoice_items.map((item: any) => ({
            ...item,
            invoice_id: id,
          }));

          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsWithInvoiceId);

          if (itemsError) throw itemsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Invoice updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, handle related records that reference this invoice
      // Update pos_sales to remove the invoice_id reference
      const { error: posError } = await supabase
        .from('pos_sales')
        .update({ invoice_id: null })
        .eq('invoice_id', id);

      if (posError) {
        console.warn('Warning updating pos_sales:', posError);
        // Continue with deletion even if this fails
      }

      // Delete related invoice items first
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (itemsError) {
        console.warn('Warning deleting invoice items:', itemsError);
        // Continue with deletion even if this fails
      }

      // Delete related payments
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('invoice_id', id);

      if (paymentsError) {
        console.warn('Warning deleting payments:', paymentsError);
        // Continue with deletion even if this fails
      }

      // Finally, delete the invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Invoice deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice. Please try again.');
    },
  });
};
