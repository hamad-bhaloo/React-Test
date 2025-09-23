
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useInvoiceNumber = (prefix: string = 'INV', numbering: string = 'auto') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['next-invoice-number', user?.id, prefix, numbering],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get the last invoice number with this prefix
      const { data: lastInvoice, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('user_id', user.id)
        .like('invoice_number', `${prefix}-%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextNumber = 1;

      if (lastInvoice && !error) {
        // Extract the number part from the last invoice
        const numberPart = lastInvoice.invoice_number.split('-').pop();
        if (numberPart && !isNaN(parseInt(numberPart))) {
          nextNumber = parseInt(numberPart) + 1;
        }
      }

      // Generate based on numbering type
      if (numbering === 'date') {
        const today = new Date();
        const dateStr = today.getFullYear().toString() + 
                       (today.getMonth() + 1).toString().padStart(2, '0') + 
                       today.getDate().toString().padStart(2, '0');
        return `${prefix}-${dateStr}-${nextNumber.toString().padStart(3, '0')}`;
      } else {
        return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
      }
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fresh
  });
};
