import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface DebtCollectionFilters {
  status?: string;
  priority?: string;
  search?: string;
  overdueDays?: number;
}

export const useDebtCollections = (filters?: DebtCollectionFilters) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up real-time subscriptions for automatic updates
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to invoice changes (status, payment_status, due_date changes)
    const invoiceChannel = supabase
      .channel('invoice-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Invoice changed, refreshing debt collections:', payload);
          // Invalidate and refetch debt collection queries
          queryClient.invalidateQueries({ queryKey: ['debt-collections'] });
          queryClient.invalidateQueries({ queryKey: ['overdue-invoices'] });
        }
      )
      .subscribe();

    // Subscribe to debt collection changes
    const debtCollectionChannel = supabase
      .channel('debt-collection-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debt_collections',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Debt collection changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['debt-collections'] });
          queryClient.invalidateQueries({ queryKey: ['debt-collection'] });
        }
      )
      .subscribe();

    // Subscribe to debt collection activities
    const activityChannel = supabase
      .channel('debt-activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debt_collection_activities',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Debt collection activity changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['debt-collection'] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(invoiceChannel);
      supabase.removeChannel(debtCollectionChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['debt-collections', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      let query = supabase
        .from('debt_collections')
        .select(`
          *,
          invoices!inner(
            id,
            invoice_number,
            total_amount,
            paid_amount,
            due_date,
            client_id,
            clients(name, email, phone)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.search) {
        query = query.or(`collection_notes.ilike.%${filters.search}%,invoices.invoice_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    // Add refetch options for better real-time experience
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useDebtCollection = (debtCollectionId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['debt-collection', debtCollectionId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('debt_collections')
        .select(`
          *,
          invoices!inner(
            id,
            invoice_number,
            total_amount,
            paid_amount,
            due_date,
            client_id,
            clients(name, email, phone, company)
          ),
          debt_collection_activities(*)
        `)
        .eq('id', debtCollectionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!debtCollectionId,
  });
};

export const useCreateDebtCollection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('debt_collections')
        .insert([{ ...data, user_id: user.id }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-collections'] });
      toast({ title: 'Success', description: 'Debt collection case created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create debt collection case', variant: 'destructive' });
      console.error('Create debt collection error:', error);
    },
  });
};

export const useUpdateDebtCollection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('debt_collections')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-collections'] });
      queryClient.invalidateQueries({ queryKey: ['debt-collection'] });
      toast({ title: 'Success', description: 'Debt collection case updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update debt collection case', variant: 'destructive' });
      console.error('Update debt collection error:', error);
    },
  });
};

export const useAddCollectionActivity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('debt_collection_activities')
        .insert([{ ...data, user_id: user.id }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-collection'] });
      toast({ title: 'Success', description: 'Activity logged successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to log activity', variant: 'destructive' });
      console.error('Add activity error:', error);
    },
  });
};

export const useOverdueInvoices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up real-time subscription for overdue invoices
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('overdue-invoice-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Invoice changed, checking for overdue updates:', payload);
          queryClient.invalidateQueries({ queryKey: ['overdue-invoices'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['overdue-invoices', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      console.log('Fetching overdue invoices for date:', todayStr);

      // First get overdue invoices
      const { data: overdueInvoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          paid_amount,
          due_date,
          payment_status,
          clients(name, email, phone)
        `)
        .eq('user_id', user.id)
        .in('payment_status', ['unpaid', 'partial', 'partially_paid'])
        .lte('due_date', todayStr)
        .order('due_date', { ascending: true });

      if (invoiceError) {
        console.error('Error fetching overdue invoices:', invoiceError);
        throw invoiceError;
      }

      console.log('Raw overdue invoices:', overdueInvoices);

      // Get existing debt collection cases to exclude them
      const { data: existingCases, error: casesError } = await supabase
        .from('debt_collections')
        .select('invoice_id')
        .eq('user_id', user.id);

      if (casesError) {
        console.error('Error fetching existing cases:', casesError);
        throw casesError;
      }

      console.log('Existing debt collection cases:', existingCases);

      // Filter out invoices that already have debt collection cases
      const existingInvoiceIds = new Set(existingCases?.map(c => c.invoice_id) || []);
      const availableInvoices = overdueInvoices?.filter(invoice => 
        !existingInvoiceIds.has(invoice.id)
      ) || [];

      console.log('Available overdue invoices after filtering:', availableInvoices);

      return availableInvoices;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};