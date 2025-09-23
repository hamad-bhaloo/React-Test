import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Users, Loader } from 'lucide-react';
import { DashboardFilters } from './DashboardFilters';
import { currencies } from '@/constants/currencies';

interface ClientActivityChartProps {
  filters: DashboardFilters;
}

const ClientActivityChart = ({ filters }: ClientActivityChartProps) => {
  const { user } = useAuth();
  const { selectedCurrency } = useCurrency();

  // Get currency symbol for display
  const currencyInfo = currencies.find(c => c.code === selectedCurrency);
  const currencySymbol = currencyInfo?.symbol || '$';

  const { data: clientData, isLoading } = useQuery({
    queryKey: ['client-activity-chart', user?.id, selectedCurrency, filters],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get clients with their invoice counts (filtered by currency)
      let clientQuery = supabase
        .from('clients')
        .select(`
          id, 
          name, 
          first_name, 
          last_name, 
          company,
          client_type,
          invoices:invoices(id, total_amount, created_at, status, payment_status, currency)
        `)
        .eq('user_id', user.id)
        .eq('invoices.currency', selectedCurrency);

      // Apply client type filter
      if (filters.clientType !== 'all') {
        clientQuery = clientQuery.eq('client_type', filters.clientType);
      }

      const { data: clients, error } = await clientQuery;
      if (error) throw error;

      // Process the data
      const processedData = clients?.map(client => {
        let invoices = client.invoices || [];

        // Apply date filter to invoices
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
          
          invoices = invoices.filter((inv: any) => 
            new Date(inv.created_at) >= startDate
          );
        }

        // Apply invoice status filter
        if (filters.invoiceStatus !== 'all') {
          invoices = invoices.filter((inv: any) => inv.status === filters.invoiceStatus);
        }

        // Apply payment status filter
        if (filters.paymentStatus !== 'all') {
          invoices = invoices.filter((inv: any) => inv.payment_status === filters.paymentStatus);
        }

        const totalAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);
        const clientName = client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.company || 'Unknown';

        return {
          name: clientName.length > 15 ? clientName.substring(0, 15) + '...' : clientName,
          invoices: invoices.length,
          revenue: totalAmount,
          fullName: clientName
        };
      }).filter(client => client.invoices > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8); // Top 8 clients

      return processedData || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Top Client Activity
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
        <Users size={20} className="text-primary" />
        Top Client Activity
      </h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={clientData || []} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
            <XAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(value) => `${currencySymbol}${(value/1000).toFixed(0)}k`}
            />
            <YAxis 
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              width={80}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)'
              }}
              formatter={(value, name, props) => [
                name === 'revenue' ? `${currencySymbol}${Number(value).toLocaleString()}` : value,
                name === 'revenue' ? 'Revenue' : 'Invoices'
              ]}
              labelFormatter={(label, payload) => {
                const data = payload?.[0]?.payload;
                return data?.fullName || label;
              }}
            />
            <Bar 
              dataKey="revenue" 
              fill="#f97316" 
              radius={[0, 2, 2, 0]}
              name="revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ClientActivityChart;