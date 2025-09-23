import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { FileText, Loader } from 'lucide-react';
import { DashboardFilters } from './DashboardFilters';

interface InvoiceStatusChartProps {
  filters: DashboardFilters;
}

const InvoiceStatusChart = ({ filters }: InvoiceStatusChartProps) => {
  const { user } = useAuth();
  const { selectedCurrency } = useCurrency();

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['invoice-status-chart', user?.id, selectedCurrency, filters],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // First get POS-generated invoice IDs to exclude them
      const { data: posInvoices, error: posError } = await supabase
        .from('pos_sales')
        .select('invoice_id')
        .eq('user_id', user.id)
        .not('invoice_id', 'is', null);
      
      if (posError) throw posError;
      
      const posInvoiceIds = new Set(posInvoices?.map(sale => sale.invoice_id) || []);

      let query = supabase
        .from('invoices')
        .select('id, status, payment_status, currency')
        .eq('user_id', user.id)
        .eq('currency', selectedCurrency);

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
        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply status filters
      if (filters.invoiceStatus !== 'all') {
        query = query.eq('status', filters.invoiceStatus);
      }

      if (filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus);
      }

      if (filters.currency !== 'USD' && filters.currency !== selectedCurrency) {
        query = query.eq('currency', filters.currency);
      }

      const { data: allInvoices, error } = await query;
      if (error) throw error;
      
      // Filter out POS-generated invoices
      const data = allInvoices?.filter(invoice => !posInvoiceIds.has(invoice.id)) || [];

      // Group by status
      const statusCounts = data.reduce((acc: any, invoice) => {
        const status = invoice.status || 'draft';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const colors = {
        draft: '#64748b',
        sent: '#3b82f6',
        viewed: '#10b981',
        overdue: '#ef4444'
      };

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: colors[status as keyof typeof colors] || '#64748b'
      }));
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-primary" />
          Invoice Status Distribution
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
        <FileText size={20} className="text-primary" />
        Invoice Status Distribution
      </h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData || []}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {statusData?.map((entry, index) => (
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

export default InvoiceStatusChart;