
import { ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const RecentTransactions = () => {
  const { user } = useAuth();

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['recent-transactions', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found for recent transactions');
        throw new Error('User not authenticated');
      }
      
      console.log('Fetching recent transactions for user:', user.id);
      
      // Fetch recent payments with invoice details
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          invoices (
            invoice_number,
            clients (
              name,
              first_name,
              last_name,
              company
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }
      
      // Also fetch recent invoices created
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            name,
            first_name,
            last_name,
            company
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
        throw invoicesError;
      }
      
      // Combine and sort by date
      const allTransactions = [
        ...(payments || []).map(payment => ({
          id: payment.id,
          type: 'payment',
          amount: Number(payment.amount),
          date: payment.created_at,
          description: `Payment received`,
          client: payment.invoices?.clients?.name || 
                 `${payment.invoices?.clients?.first_name || ''} ${payment.invoices?.clients?.last_name || ''}`.trim() ||
                 payment.invoices?.clients?.company || 'Unknown Client',
          invoice_number: payment.invoices?.invoice_number || 'N/A'
        })),
        ...(invoices || []).map(invoice => ({
          id: invoice.id,
          type: 'invoice',
          amount: Number(invoice.total_amount) || 0,
          date: invoice.created_at,
          description: `Invoice ${invoice.invoice_number} created`,
          client: invoice.clients?.name || 
                 `${invoice.clients?.first_name || ''} ${invoice.clients?.last_name || ''}`.trim() ||
                 invoice.clients?.company || 'Unknown Client',
          invoice_number: invoice.invoice_number
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
      
      console.log('Recent transactions processed:', allTransactions);
      return allTransactions;
    },
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
  });

  console.log('RecentTransactions - isLoading:', isLoading, 'error:', error, 'transactions:', transactions);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Transactions</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('RecentTransactions error:', error);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {transactions && transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'payment' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {transaction.type === 'payment' ? (
                    <ArrowDownRight size={20} className="text-green-600" />
                  ) : (
                    <ArrowUpRight size={20} className="text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-600">
                    {transaction.client} • {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'payment' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {transaction.type === 'payment' ? '+' : ''}${transaction.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{transaction.invoice_number}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No recent transactions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
