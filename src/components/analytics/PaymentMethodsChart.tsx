import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CreditCard, Loader } from 'lucide-react';
import { DashboardFilters } from './DashboardFilters';
import { currencies } from '@/constants/currencies';

interface PaymentMethodsChartProps {
  filters: DashboardFilters;
}

const PaymentMethodsChart = ({ filters }: PaymentMethodsChartProps) => {
  const { user } = useAuth();
  const { selectedCurrency } = useCurrency();

  // Get currency symbol for display
  const currencyInfo = currencies.find(c => c.code === selectedCurrency);
  const currencySymbol = currencyInfo?.symbol || '$';

  const { data: paymentData, isLoading } = useQuery({
    queryKey: ['payment-methods-chart', user?.id, selectedCurrency, filters],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // First get POS-generated invoice IDs to exclude their payments
      const { data: posInvoices, error: posError } = await supabase
        .from('pos_sales')
        .select('invoice_id')
        .eq('user_id', user.id)
        .not('invoice_id', 'is', null);
      
      if (posError) throw posError;
      
      const posInvoiceIds = new Set(posInvoices?.map(sale => sale.invoice_id) || []);

      // Get currency-filtered invoice IDs first
      const { data: currencyInvoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id)
        .eq('currency', selectedCurrency);
      
      if (invoiceError) throw invoiceError;
      
      const currencyInvoiceIds = currencyInvoices?.map(inv => inv.id) || [];
      
      let query = supabase
        .from('payments')
        .select('payment_method, amount, payment_date, invoice_id')
        .eq('user_id', user.id)
        .in('invoice_id', currencyInvoiceIds.length > 0 ? currencyInvoiceIds : ['']);

      // Apply date filter
      if (filters.dateRange !== 'all_time') {
        const daysMap = {
          'last_7_days': 7,
          'last_30_days': 30,
          'last_90_days': 90,
          'last_6_months': 180,
          'last_year': 365
        };
        const days = daysMap[filters.dateRange as keyof typeof daysMap];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('payment_date', startDate.toISOString().split('T')[0]);
      }

      const { data: allPayments, error } = await query;
      if (error) throw error;
      
      // Filter out payments for POS-generated invoices
      const data = allPayments?.filter(payment => 
        !payment.invoice_id || !posInvoiceIds.has(payment.invoice_id)
      ) || [];

      // Group by payment method
      const methodCounts = data.reduce((acc: any, payment) => {
        const method = payment.payment_method || 'cash';
        acc[method] = {
          count: (acc[method]?.count || 0) + 1,
          amount: (acc[method]?.amount || 0) + Number(payment.amount)
        };
        return acc;
      }, {});

      const colors = {
        cash: '#10b981',
        card: '#3b82f6',
        bank_transfer: '#8b5cf6',
        crypto: '#f59e0b',
        wallet: '#ef4444',
        check: '#64748b'
      };

      return Object.entries(methodCounts).map(([method, data]: [string, any]) => ({
        name: method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: data.count,
        amount: data.amount,
        color: colors[method as keyof typeof colors] || '#64748b'
      }));
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CreditCard size={20} className="text-primary" />
          Payment Methods
        </h3>
        <div className="h-48 flex items-center justify-center">
          <Loader size={20} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <CreditCard size={20} className="text-primary" />
        Payment Methods
      </h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={paymentData || []}
              cx="50%"
              cy="50%"
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {paymentData?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)'
              }}
              formatter={(value, name, props) => [
                `${value} payments (${currencySymbol}${props.payload.amount.toLocaleString()})`,
                props.payload.name
              ]}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PaymentMethodsChart;