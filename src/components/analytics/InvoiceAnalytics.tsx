import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, DollarSign, Clock, TrendingUp, Loader } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { currencies } from '@/constants/currencies';

interface InvoiceAnalyticsProps {
  filters?: {
    dateRange: string;
    status: string;
    paymentStatus: string;
    clientType: string;
  };
}

const InvoiceAnalytics = ({ filters }: InvoiceAnalyticsProps) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  
  // Get currency symbol
  const currencyInfo = currencies.find(c => c.code === settings.defaultCurrency);
  const currencySymbol = currencyInfo?.symbol || '$';

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['invoice-analytics', user?.id, filters],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('invoices')
        .select(`
          id,
          total_amount,
          status,
          payment_status,
          created_at,
          due_date,
          paid_amount,
          currency,
          clients:clients(client_type)
        `)
        .eq('user_id', user.id);

      // Apply date filter
      if (filters?.dateRange && filters.dateRange !== 'all_time') {
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

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus);
      }

      const { data: invoices, error } = await query;
      if (error) throw error;

      // Filter by client type if needed
      let filteredInvoices = invoices;
      if (filters?.clientType && filters.clientType !== 'all') {
        filteredInvoices = invoices.filter(inv => 
          inv.clients?.client_type === filters.clientType
        );
      }

      // Process monthly trends
      const monthlyData = {};
      const monthsToShow = filters?.dateRange === 'last_year' ? 12 : 6;
      
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substr(0, 7);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        monthlyData[monthKey] = {
          month: monthName,
          invoiced: 0,
          paid: 0,
          pending: 0,
          count: 0
        };
      }

      // Aggregate monthly data
      filteredInvoices.forEach(invoice => {
        const monthKey = invoice.created_at.substr(0, 7);
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].invoiced += invoice.total_amount || 0;
          monthlyData[monthKey].count += 1;
          
          if (invoice.payment_status === 'paid') {
            monthlyData[monthKey].paid += invoice.total_amount || 0;
          } else {
            monthlyData[monthKey].pending += invoice.total_amount || 0;
          }
        }
      });

      // Status distribution
      const statusData = filteredInvoices.reduce((acc: any, invoice) => {
        const status = invoice.status || 'draft';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Payment status distribution
      const paymentData = filteredInvoices.reduce((acc: any, invoice) => {
        const status = invoice.payment_status || 'unpaid';
        acc[status] = {
          count: (acc[status]?.count || 0) + 1,
          amount: (acc[status]?.amount || 0) + (invoice.total_amount || 0)
        };
        return acc;
      }, {});

      // Average invoice value by month
      const avgValueData = Object.values(monthlyData).map((month: any) => ({
        ...month,
        avgValue: month.count > 0 ? month.invoiced / month.count : 0
      }));

      const colors = {
        draft: '#64748b',
        sent: '#3b82f6',
        viewed: '#10b981',
        overdue: '#ef4444',
        paid: '#10b981',
        unpaid: '#ef4444',
        partially_paid: '#f59e0b'
      };

      return {
        monthlyTrends: Object.values(monthlyData),
        avgValueTrends: avgValueData,
        statusDistribution: Object.entries(statusData).map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
          color: colors[status as keyof typeof colors] || '#64748b'
        })),
        paymentDistribution: Object.entries(paymentData).map(([status, data]: [string, any]) => ({
          name: status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          value: data.count,
          amount: data.amount,
          color: colors[status as keyof typeof colors] || '#64748b'
        })),
        totalInvoices: filteredInvoices.length,
        totalValue: filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
        paidValue: filteredInvoices
          .filter(inv => inv.payment_status === 'paid')
          .reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
        pendingValue: filteredInvoices
          .filter(inv => inv.payment_status !== 'paid')
          .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm">
            <div className="h-48 flex items-center justify-center">
              <Loader size={20} className="animate-spin text-primary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Revenue Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Revenue Trends
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData?.monthlyTrends || []}>
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
                  tick={{ fill: '#64748b', fontSize: 11 }}
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
                  formatter={(value, name) => [`${currencySymbol}${Number(value).toLocaleString()}`, name === 'paid' ? 'Paid' : 'Pending']}
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

        {/* Average Invoice Value */}
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-primary" />
            Average Invoice Value
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData?.avgValueTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(value) => `${currencySymbol}${(value/1000).toFixed(1)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(8px)'
                  }}
                  formatter={(value) => [`${currencySymbol}${Number(value).toLocaleString()}`, 'Avg Value']}
                />
                <Bar 
                  dataKey="avgValue" 
                  fill="#3b82f6" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invoice Status */}
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Invoice Status
          </h3>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analyticsData?.statusDistribution?.map((entry, index) => (
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

        {/* Payment Status */}
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Payment Status
          </h3>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData?.paymentDistribution || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analyticsData?.paymentDistribution?.map((entry, index) => (
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
                    `${value} invoices (${currencySymbol}${props.payload.amount.toLocaleString()})`,
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
      </div>
    </div>
  );
};

export default InvoiceAnalytics;