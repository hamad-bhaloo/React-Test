
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SearchResult {
  id: string;
  type: 'client' | 'invoice' | 'company' | 'payment';
  title: string;
  subtitle: string;
  url: string;
}

export const useGlobalSearch = (query: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['global-search', user?.id, query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!user?.id || !query || query.length < 2) {
        return [];
      }
      
      const results: SearchResult[] = [];
      const searchTerm = `%${query.toLowerCase()}%`;
      
      // Search clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, first_name, last_name, name, email, company')
        .eq('user_id', user.id)
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`)
        .limit(5);
      
      if (clients) {
        clients.forEach(client => {
          const clientName = client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email;
          results.push({
            id: client.id,
            type: 'client',
            title: clientName,
            subtitle: client.company || client.email || 'Client',
            url: `/clients`
          });
        });
      }
      
      // Search invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          status,
          clients (name, first_name, last_name, email)
        `)
        .eq('user_id', user.id)
        .or(`invoice_number.ilike.${searchTerm},notes.ilike.${searchTerm}`)
        .limit(5);
      
      if (invoices) {
        invoices.forEach(invoice => {
          const client = invoice.clients as any;
          const clientName = client?.name || `${client?.first_name || ''} ${client?.last_name || ''}`.trim() || client?.email || 'Unknown Client';
          results.push({
            id: invoice.id,
            type: 'invoice',
            title: `Invoice ${invoice.invoice_number}`,
            subtitle: `$${invoice.total_amount} - ${clientName}`,
            url: `/invoices/${invoice.id}`
          });
        });
      }
      
      // Search companies
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, email')
        .eq('user_id', user.id)
        .ilike('name', searchTerm)
        .limit(3);
      
      if (companies) {
        companies.forEach(company => {
          results.push({
            id: company.id,
            type: 'company',
            title: company.name,
            subtitle: company.email || 'Company',
            url: `/company`
          });
        });
      }
      
      // Search payments
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          payment_method,
          invoices (invoice_number)
        `)
        .eq('user_id', user.id)
        .or(`payment_method.ilike.${searchTerm},notes.ilike.${searchTerm}`)
        .limit(3);
      
      if (payments) {
        payments.forEach(payment => {
          const invoice = payment.invoices as any;
          results.push({
            id: payment.id,
            type: 'payment',
            title: `Payment $${payment.amount}`,
            subtitle: `${payment.payment_method} - ${invoice?.invoice_number || 'Payment'}`,
            url: `/invoices`
          });
        });
      }
      
      return results;
    },
    enabled: !!user?.id && !!query && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};
