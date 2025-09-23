
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useWallet = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for fetching wallet');
        return null;
      }
      
      console.log('Fetching wallet for user:', user.id);
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching wallet:', error);
        throw error;
      }
      
      // If no wallet exists, create one
      if (!data) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            currency: 'CREDITS'
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating wallet:', createError);
          throw createError;
        }
        
        return newWallet;
      }
      
      console.log('Successfully fetched wallet:', data);
      return data;
    },
    enabled: !!user?.id,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTransactions = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for fetching transactions');
        return [];
      }
      
      console.log('Fetching transactions for user:', user.id);
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          invoices (
            id,
            invoice_number,
            total_amount
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      
      console.log('Successfully fetched transactions:', data?.length);
      return data || [];
    },
    enabled: !!user?.id,
    retry: 3,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useAddFunds = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, method }: { amount: number; method: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Create Stripe checkout session for payment
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planName: `Add Wallet Credits`,
          planPrice: amount, // Amount in USD
          mode: 'payment', // one-time payment
          credits: amount * 3 // $1 = 3 credits
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        toast.success('Redirecting to payment...');
        return data;
      }

      throw new Error('Failed to create payment session');
    },
    onError: (error) => {
      console.error('Error adding funds:', error);
      toast.error('Failed to initiate payment');
    },
  });
};

export const usePayInvoiceWithWallet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ invoiceId, amount }: { invoiceId: string; amount: number }) => {
      if (!user) throw new Error('User not authenticated');

      // Convert USD amount to credits (assuming 1 USD = 3 credits for invoice payments)
      const creditsRequired = amount * 3;

      // Get user's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!wallet) throw new Error('Wallet not found');
      if (wallet.balance < creditsRequired) throw new Error('Insufficient wallet credits');

      // Create payment transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          invoice_id: invoiceId,
          type: 'payment',
          amount: creditsRequired,
          payment_method: 'wallet',
          description: `Invoice payment`,
          status: 'completed'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Record payment in payments table
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          user_id: user.id,
          amount: amount,
          payment_method: 'wallet',
          payment_date: new Date().toISOString().split('T')[0]
        });

      if (paymentError) throw paymentError;

      // Update invoice payment status
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          paid_amount: amount,
          payment_status: 'paid',
          status: 'paid'
        })
        .eq('id', invoiceId);

      if (invoiceError) throw invoiceError;

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Invoice paid successfully with wallet credits!');
    },
    onError: (error) => {
      console.error('Error paying invoice with wallet:', error);
      toast.error(error.message || 'Failed to pay invoice');
    },
  });
};
