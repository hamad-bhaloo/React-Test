import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TrendingUp, Loader } from 'lucide-react';
import { DashboardFilters } from './DashboardFilters';
import { currencies } from '@/constants/currencies';

interface MonthlyTrendChartProps {
  filters: DashboardFilters;
}

const MonthlyTrendChart = ({ filters }: MonthlyTrendChartProps) => {
  const { user } = useAuth();
  const { selectedCurrency } = useCurrency();

  // Get currency symbol for display
  const currencyInfo = currencies.find(c => c.code === selectedCurrency);
  const currencySymbol = currencyInfo?.symbol || '$';

  const { data: trendData, isLoading } = useQuery({
    queryKey: ['monthly-trend-chart', user?.id, selectedCurrency, filters],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Determine the number of months to fetch based on filter
      const monthsMap = {
        'last_7_days': 1,
        'last_30_days': 2,
        'last_90_days': 3,
        'last_6_months': 6,
        'last_year': 12,
        'all_time': 12
      };
      
      const monthsToFetch = monthsMap[filters.dateRange as keyof typeof monthsMap] || 6;
      
      // First get POS-generated invoice IDs to exclude them
      const { data: posInvoices, error: posError } = await supabase
        .from('pos_sales')
        .select('invoice_id')
        .eq('user_id', user.id)
        .not('invoice_id', 'is', null);
      
      if (posError) throw posError;
      
      const posInvoiceIds = new Set(posInvoices?.map(sale => sale.invoice_id) || []);
      
      let invoiceQuery = supabase
        .from('invoices')
        .select('id, total_amount, created_at, status, payment_status, currency')
        .eq('user_id', user.id)
        .eq('currency', selectedCurrency);

      // Apply filters
      if (filters.invoiceStatus !== 'all') {
        invoiceQuery = invoiceQuery.eq('status', filters.invoiceStatus);
      }

      if (filters.paymentStatus !== 'all') {
        invoiceQuery = invoiceQuery.eq('payment_status', filters.paymentStatus);
      }

      if (filters.currency !== 'USD' && filters.currency !== selectedCurrency) {
        invoiceQuery = invoiceQuery.eq('currency', filters.currency);
      }

      const { data: allInvoices, error } = await invoiceQuery;
      if (error) throw error;
      
      // Filter out POS-generated invoices
      const invoices = allInvoices?.filter(invoice => !posInvoiceIds.has(invoice.id)) || [];

      // Create monthly data structure
      const monthlyData = {};
      
      for (let i = monthsToFetch - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substr(0, 7); // YYYY-MM format
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        monthlyData[monthKey] = {
          month: monthName,
          invoices: 0,
          revenue: 0,
          paid: 0,
          pending: 0
        };
      }

      // Aggregate invoice data
      invoices?.forEach(invoice => {
        const monthKey = invoice.created_at.substr(0, 7);
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].invoices += 1;
          monthlyData[monthKey].revenue += invoice.total_amount || 0;
          
          if (invoice.payment_status === 'paid') {
            monthlyData[monthKey].paid += invoice.total_amount || 0;
          } else {
            monthlyData[monthKey].pending += invoice.total_amount || 0;
          }
        }
      });

      return Object.values(monthlyData);
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          Revenue Trends
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
        <TrendingUp size={20} className="text-primary" />
        Revenue Trends
      </h3>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
          <span className="text-xs font-medium text-slate-600">Paid</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
          <span className="text-xs font-medium text-slate-600">Pending</span>
        </div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData || []}>
            <defs>
              <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(value) => `${currencySymbol}${(value/1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)'
              }}
              formatter={(value, name) => [
                `${currencySymbol}${Number(value).toLocaleString()}`, 
                name === 'paid' ? 'Paid Revenue' : 'Pending Revenue'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="paid" 
              stackId="1"
              stroke="#10b981" 
              strokeWidth={2}
              fill="url(#paidGradient)"
            />
            <Area 
              type="monotone" 
              dataKey="pending" 
              stackId="1"
              stroke="#f59e0b" 
              strokeWidth={2}
              fill="url(#pendingGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyTrendChart;