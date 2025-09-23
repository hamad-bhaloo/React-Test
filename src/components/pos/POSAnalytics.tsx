import React, { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyWithCode } from '@/utils/currencyConverter';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface POSAnalyticsProps { currency?: string }

const POSAnalytics: React.FC<POSAnalyticsProps> = ({ currency = 'USD' }) => {
  const [timeRange, setTimeRange] = useState('30');
  const { user } = useAuth();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['pos-analytics', user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from('pos_sales')
        .select(`
          *,
          items:pos_sale_items(*)
        `)
        .eq('user_id', user.id)
        .gte('sale_date', startDate.toISOString())
        .order('sale_date', { ascending: true });

      if (salesError) throw salesError;

      // Process data for charts
      const dailySales = sales.reduce((acc, sale) => {
        const date = new Date(sale.sale_date).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, sales: 0, transactions: 0 };
        }
        acc[date].sales += sale.total_amount;
        acc[date].transactions += 1;
        return acc;
      }, {} as any);

      const paymentMethods = sales.reduce((acc, sale) => {
        acc[sale.payment_method] = (acc[sale.payment_method] || 0) + sale.total_amount;
        return acc;
      }, {} as any);

      const topProducts = sales.flatMap(sale => sale.items || [])
        .reduce((acc, item) => {
          if (!acc[item.product_name]) {
            acc[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
          }
          acc[item.product_name].quantity += item.quantity;
          acc[item.product_name].revenue += item.line_total;
          return acc;
        }, {} as any);

      const hourlyTrends = sales.reduce((acc, sale) => {
        const hour = new Date(sale.sale_date).getHours();
        if (!acc[hour]) {
          acc[hour] = { hour: `${hour}:00`, sales: 0, transactions: 0 };
        }
        acc[hour].sales += sale.total_amount;
        acc[hour].transactions += 1;
        return acc;
      }, {} as any);

      return {
        totalSales: sales.reduce((sum, sale) => sum + sale.total_amount, 0),
        totalTransactions: sales.length,
        averageTicket: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total_amount, 0) / sales.length : 0,
        dailySalesData: Object.values(dailySales),
        paymentMethodsData: Object.entries(paymentMethods).map(([method, amount]) => ({
          method,
          amount,
        })),
        topProductsData: Object.values(topProducts)
          .sort((a: any, b: any) => b.revenue - a.revenue)
          .slice(0, 10),
        hourlyTrendsData: Object.values(hourlyTrends),
        sales,
      };
    },
    enabled: !!user?.id,
  });

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">POS Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyWithCode(analyticsData?.totalSales || 0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Ticket</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyWithCode(analyticsData?.averageTicket || 0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.topProductsData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Different products sold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData?.dailySalesData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [formatCurrencyWithCode(value, currency), 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.paymentMethodsData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percent }) => `${method} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {analyticsData?.paymentMethodsData?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrencyWithCode(value, currency)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.topProductsData?.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [formatCurrencyWithCode(value, currency), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData?.hourlyTrendsData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [formatCurrencyWithCode(value, currency), 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#ffc658" fill="#ffc658" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POSAnalytics;