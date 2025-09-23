import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuotationAnalyticsProps {
  quotations: any[];
}

const QuotationAnalytics: React.FC<QuotationAnalyticsProps> = ({ quotations }) => {
  // Calculate analytics data
  const statusData = quotations.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Draft', value: statusData.draft || 0, color: 'hsl(var(--muted-foreground))' },
    { name: 'Sent', value: statusData.sent || 0, color: 'hsl(var(--primary))' },
    { name: 'Accepted', value: statusData.accepted || 0, color: 'hsl(220, 70%, 50%)' },
    { name: 'Declined', value: statusData.declined || 0, color: 'hsl(0, 70%, 50%)' },
    { name: 'Converted', value: statusData.converted || 0, color: 'hsl(120, 70%, 45%)' },
  ];

  // Monthly trend data
  const monthlyData = quotations.reduce((acc, q) => {
    const month = new Date(q.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.count += 1;
      existing.value += q.total_amount || 0;
    } else {
      acc.push({ month, count: 1, value: q.total_amount || 0 });
    }
    return acc;
  }, [] as Array<{ month: string; count: number; value: number }>).slice(-6);

  const totalValue = quotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  const avgValue = quotations.length > 0 ? totalValue / quotations.length : 0;
  const conversionRate = quotations.length > 0 ? ((statusData.accepted || 0) + (statusData.converted || 0)) / quotations.length * 100 : 0;

  return (
    <div className="grid gap-4">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">${totalValue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">All quotations</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Value</p>
                <p className="text-2xl font-bold text-foreground">${avgValue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Per quotation</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold text-foreground">{conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Accepted + Converted</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Count</p>
                <p className="text-2xl font-bold text-foreground">{quotations.length}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <Card className="bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="h-48 w-full lg:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.filter(d => d.value > 0).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuotationAnalytics;