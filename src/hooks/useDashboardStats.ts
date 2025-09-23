
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useDashboardStats = (selectedCurrency?: string) => {
  const { user } = useAuth();
  const currency = selectedCurrency || 'USD';
  
  return useQuery({
    queryKey: ['dashboard-stats', user?.id, currency],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for dashboard stats');
        throw new Error('User not authenticated');
      }
      
      console.log('Fetching dashboard stats for user:', user.id);
      
      // Fetch invoices with totals (exclude deleted ones and POS-generated, filter by currency)
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('total_amount, payment_status, status, created_at, id, currency')
        .eq('user_id', user.id)
        .eq('currency', currency)
        .neq('status', 'deleted');
      
      if (invoicesError) {
        console.error('Error fetching invoices for stats:', invoicesError);
        throw invoicesError;
      }
      
      // Filter out POS-generated invoices
      const { data: posInvoices, error: posError } = await supabase
        .from('pos_sales')
        .select('invoice_id')
        .eq('user_id', user.id)
        .not('invoice_id', 'is', null);
      
      if (posError) {
        console.error('Error fetching POS invoices:', posError);
        throw posError;
      }
      
      const posInvoiceIds = new Set(posInvoices?.map(sale => sale.invoice_id) || []);
      const filteredInvoices = invoices?.filter(invoice => !posInvoiceIds.has(invoice.id)) || [];
      
      console.log('Fetched invoices for stats (before filtering):', invoices?.length);
      console.log('Filtered invoices for stats (excluding POS):', filteredInvoices?.length);
      
      // Fetch clients count
      const { count: clientsCount, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (clientsError) {
        console.error('Error fetching clients count:', clientsError);
        throw clientsError;
      }
      
      console.log('Clients count:', clientsCount);
      
      // Fetch recent payments for activity (filter by currency through invoice relationship)
      const currencyFilteredInvoiceIds = filteredInvoices.map(inv => inv.id);
      
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, created_at, invoice_id')
        .eq('user_id', user.id)
        .in('invoice_id', currencyFilteredInvoiceIds.length > 0 ? currencyFilteredInvoiceIds : [''])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }
      
      console.log('Fetched payments for stats:', payments?.length);
      
      // Fetch debt collection amounts (only for currency-filtered invoices)
      const invoiceIds = filteredInvoices.map(inv => inv.id);
      
      const { data: debtCollections, error: debtError } = await supabase
        .from('debt_collections')
        .select('amount_collected, created_at, invoice_id')
        .eq('user_id', user.id)
        .in('invoice_id', invoiceIds.length > 0 ? invoiceIds : ['']);
      
      if (debtError) {
        console.error('Error fetching debt collections:', debtError);
        throw debtError;
      }
      
      console.log('Fetched debt collections for stats:', debtCollections?.length);
      
      // Calculate statistics (using filtered invoices)
      const totalInvoicesSent = filteredInvoices.reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
      const revenueReceived = filteredInvoices.filter(inv => inv.payment_status === 'paid')
        .reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
      const pendingPayments = filteredInvoices.filter(inv => inv.payment_status === 'unpaid' || inv.payment_status === 'partial')
        .reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
      
      // Calculate actual debt collection amount
      const debtCollectionAmount = debtCollections?.reduce((sum, collection) => 
        sum + (Number(collection.amount_collected) || 0), 0) || 0;
      
      // Recent activity (last 30 days payments)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentActivity = payments?.filter(payment => 
        new Date(payment.created_at) >= thirtyDaysAgo
      ).reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Calculate period-over-period changes (current month vs previous month)
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Current month data
      const currentMonthInvoices = filteredInvoices.filter(inv => 
        new Date(inv.created_at) >= currentMonthStart
      );
      const currentMonthRevenue = currentMonthInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
      const currentMonthReceived = currentMonthInvoices.filter(inv => inv.payment_status === 'paid')
        .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
      const currentMonthPending = currentMonthInvoices.filter(inv => inv.payment_status === 'unpaid' || inv.payment_status === 'partial')
        .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);

      // Previous month data
      const previousMonthInvoices = filteredInvoices.filter(inv => {
        const invoiceDate = new Date(inv.created_at);
        return invoiceDate >= previousMonthStart && invoiceDate <= previousMonthEnd;
      });
      const previousMonthRevenue = previousMonthInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
      const previousMonthReceived = previousMonthInvoices.filter(inv => inv.payment_status === 'paid')
        .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
      const previousMonthPending = previousMonthInvoices.filter(inv => inv.payment_status === 'unpaid' || inv.payment_status === 'partial')
        .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);

      // Current vs previous month debt collections
      const currentMonthDebtCollections = debtCollections?.filter(dc => 
        new Date(dc.created_at) >= currentMonthStart
      ).reduce((sum, dc) => sum + (Number(dc.amount_collected) || 0), 0) || 0;
      
      const previousMonthDebtCollections = debtCollections?.filter(dc => {
        const dcDate = new Date(dc.created_at);
        return dcDate >= previousMonthStart && dcDate <= previousMonthEnd;
      }).reduce((sum, dc) => sum + (Number(dc.amount_collected) || 0), 0) || 0;

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const revenueChange = calculateChange(currentMonthRevenue, previousMonthRevenue);
      const debtCollectionChange = calculateChange(currentMonthDebtCollections, previousMonthDebtCollections);
      const pendingChange = calculateChange(currentMonthPending, previousMonthPending);
      const receivedChange = calculateChange(currentMonthReceived, previousMonthReceived);
      
      const stats = {
        totalInvoicesSent,
        revenueReceived,
        pendingPayments,
        debtCollectionAmount,
        recentActivity,
        clientsCount: clientsCount || 0,
        invoices: filteredInvoices,
        payments: payments || [],
        debtCollections: debtCollections || [],
        changes: {
          revenueChange,
          debtCollectionChange,
          pendingChange,
          receivedChange
        }
      };
      
      console.log('Calculated dashboard stats:', stats);
      return stats;
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
    staleTime: 2 * 60 * 1000, // 2 minutes for more frequent updates
    refetchOnWindowFocus: false, // Reduce refetch frequency
    refetchOnReconnect: true,
  });
};
