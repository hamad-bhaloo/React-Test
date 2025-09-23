
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, Activity, BarChart3 } from "lucide-react";
import { useState } from "react";
import { currencies } from "@/constants/currencies";

const WorkingCapitalChart = () => {
  const { user } = useAuth();
  const { selectedCurrency } = useCurrency();
  const [activeChart, setActiveChart] = useState<'line' | 'area' | 'bar'>('area');

  // Get currency symbol for display
  const currencyInfo = currencies.find(c => c.code === selectedCurrency);
  const currencySymbol = currencyInfo?.symbol || '$';

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['working-capital-chart', user?.id, selectedCurrency],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Fetch invoices and payments for the last 6 months (excluding POS-generated)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // First get POS-generated invoice IDs to exclude them
      const { data: posInvoices, error: posError } = await supabase
        .from('pos_sales')
        .select('invoice_id')
        .eq('user_id', user.id)
        .not('invoice_id', 'is', null);
      
      if (posError) throw posError;
      
      const posInvoiceIds = new Set(posInvoices?.map(sale => sale.invoice_id) || []);
      
      const { data: allInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, total_amount, payment_status, created_at, issue_date, currency')
        .eq('user_id', user.id)
        .eq('currency', selectedCurrency)
        .gte('created_at', sixMonthsAgo.toISOString());
      
      if (invoicesError) throw invoicesError;
      
      // Filter out POS-generated invoices
      const invoices = allInvoices?.filter(invoice => !posInvoiceIds.has(invoice.id)) || [];
      
      // Get invoice IDs for payment filtering
      const invoiceIds = invoices.map(inv => inv.id);
      
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_date, invoice_id')
        .eq('user_id', user.id)
        .in('invoice_id', invoiceIds.length > 0 ? invoiceIds : [''])
        .gte('payment_date', sixMonthsAgo.toISOString().split('T')[0]);
      
      if (paymentsError) throw paymentsError;
      
      // Group data by month
      const monthlyData = {};
      const months = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substr(0, 7); // YYYY-MM format
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        months.push(monthName);
        monthlyData[monthKey] = {
          month: monthName,
          invoiced: 0,
          received: 0,
          outstanding: 0
        };
      }
      
      // Aggregate invoice data
      invoices?.forEach(invoice => {
        const monthKey = invoice.created_at.substr(0, 7);
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].invoiced += invoice.total_amount || 0;
          if (invoice.payment_status === 'pending') {
            monthlyData[monthKey].outstanding += invoice.total_amount || 0;
          }
        }
      });
      
      // Aggregate payment data
      payments?.forEach(payment => {
        const monthKey = payment.payment_date.substr(0, 7);
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].received += payment.amount || 0;
        }
      });
      
      return Object.values(monthlyData);
    },
    enabled: !!user,
  });

  const chartConfig = {
    line: { component: LineChart, label: 'Line View' },
    area: { component: AreaChart, label: 'Area View' },
    bar: { component: BarChart, label: 'Bar View' }
  };

  const renderChart = () => {
    const ChartComponent = chartConfig[activeChart].component;
    
    if (activeChart === 'area') {
      return (
        <ChartComponent data={chartData || []}>
          <defs>
            <linearGradient id="invoicedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
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
            formatter={(value, name) => [`${currencySymbol}${Number(value).toLocaleString()}`, name === 'invoiced' ? 'Invoiced' : name === 'received' ? 'Received' : 'Outstanding']}
          />
          <Area 
            type="monotone" 
            dataKey="invoiced" 
            stroke="#f97316" 
            strokeWidth={2}
            fill="url(#invoicedGradient)"
          />
          <Area 
            type="monotone" 
            dataKey="received" 
            stroke="#10b981" 
            strokeWidth={2}
            fill="url(#receivedGradient)"
          />
        </ChartComponent>
      );
    }
    
    if (activeChart === 'bar') {
      return (
        <ChartComponent data={chartData || []}>
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
            formatter={(value, name) => [`${currencySymbol}${Number(value).toLocaleString()}`, name === 'invoiced' ? 'Invoiced' : 'Received']}
          />
          <Bar dataKey="invoiced" fill="#f97316" radius={[2, 2, 0, 0]} />
          <Bar dataKey="received" fill="#10b981" radius={[2, 2, 0, 0]} />
        </ChartComponent>
      );
    }
    
    return (
      <ChartComponent data={chartData || []}>
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
          formatter={(value, name) => [`${currencySymbol}${Number(value).toLocaleString()}`, name === 'invoiced' ? 'Invoiced' : 'Received']}
        />
        <Line 
          type="monotone" 
          dataKey="invoiced" 
          stroke="#f97316" 
          strokeWidth={3}
          dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="received" 
          stroke="#10b981" 
          strokeWidth={3}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
        />
      </ChartComponent>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Analytics</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Revenue Analytics
          </h3>
          <p className="text-xs text-slate-600">Monthly performance tracking</p>
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {Object.entries(chartConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveChart(key as any)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                activeChart === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {key === 'line' && <Activity size={12} />}
              {key === 'area' && <TrendingUp size={12} />}
              {key === 'bar' && <BarChart3 size={12} />}
            </button>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
          <span className="text-xs font-medium text-slate-600">Invoiced</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
          <span className="text-xs font-medium text-slate-600">Received</span>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WorkingCapitalChart;
