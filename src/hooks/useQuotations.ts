import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useQuotations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quotations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          clients (
            id,
            name,
            first_name,
            last_name,
            email,
            company
          ),
          quotation_items (
            id,
            product_name,
            description,
            quantity,
            rate,
            amount
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotations:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useQuotation = (quotationId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quotation', quotationId],
    queryFn: async () => {
      if (!quotationId) return null;

      const { data, error } = await supabase
        .from('quotations')
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
          quotation_items (
            id,
            product_name,
            description,
            quantity,
            rate,
            amount
          )
        `)
        .eq('id', quotationId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching quotation:', error);
        throw error;
      }

      return data;
    },
    enabled: !!quotationId && !!user?.id,
  });
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quotationData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('quotations')
        .insert({
          ...quotationData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation'] });
      toast({
        title: 'Success',
        description: 'Quotation created successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create quotation',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateQuotation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('quotations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation'] });
      toast({
        title: 'Success',
        description: 'Quotation updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quotation',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // First delete quotation items
      await supabase
        .from('quotation_items')
        .delete()
        .eq('quotation_id', quotationId);

      // Then delete the quotation
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', quotationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation'] });
      toast({
        title: 'Success',
        description: 'Quotation deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quotation',
        variant: 'destructive',
      });
    },
  });
};

export const useConvertQuotationToInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // Get quotation data
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select(`
          *,
          quotation_items (*)
        `)
        .eq('id', quotationId)
        .single();

      if (quotationError) throw quotationError;

      // Generate invoice number
      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('invoice_number')
        .like('invoice_number', 'INV-%')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastNumber = existingInvoices?.[0]?.invoice_number?.split('-')[1] || '0';
      const nextNumber = (parseInt(lastNumber) + 1).toString().padStart(4, '0');
      const invoiceNumber = `INV-${nextNumber}`;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          user_id: quotation.user_id,
          client_id: quotation.client_id,
          invoice_number: invoiceNumber,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          subtotal: quotation.subtotal,
          tax_percentage: quotation.tax_percentage,
          tax_amount: quotation.tax_amount,
          discount_amount: quotation.discount_amount,
          discount_percentage: quotation.discount_percentage,
          shipping_charge: quotation.shipping_charge,
          total_amount: quotation.total_amount,
          currency: quotation.currency,
          notes: quotation.notes,
          terms: quotation.terms,
          status: 'draft'
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      if (quotation.quotation_items && Array.isArray(quotation.quotation_items) && quotation.quotation_items.length > 0) {
        const invoiceItems = quotation.quotation_items.map((item: any) => ({
          invoice_id: invoice.id,
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);

        if (itemsError) throw itemsError;
      }

      // Update quotation to mark as converted
      await supabase
        .from('quotations')
        .update({
          status: 'converted',
          converted_to_invoice_id: invoice.id
        })
        .eq('id', quotationId);

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
      toast({
        title: 'Success',
        description: 'Quotation converted to invoice successfully',
      });
    },
    onError: (error) => {
      console.error('Error converting quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert quotation to invoice',
        variant: 'destructive',
      });
    },
  });
};