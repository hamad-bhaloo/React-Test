import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useReportBuilder } from '@/hooks/useReportBuilder';
import { useUserSettings } from '@/hooks/useUserSettings';

export const ReportPreview = () => {
  const { reportData, reportConfig } = useReportBuilder();
  const { formatCurrency } = useUserSettings();

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Generating report preview...</p>
        </div>
      </div>
    );
  }

  const { summary, trends, aging, topClients, topItems, narrative } = reportData;

  const agingData = [
    { name: 'Current', value: aging.current, color: '#10b981' },
    { name: '1-30 days', value: aging.days30, color: '#f59e0b' },
    { name: '31-60 days', value: aging.days60, color: '#ef4444' },
    { name: '61-90 days', value: aging.days90, color: '#8b5cf6' },
    { name: '90+ days', value: aging.over90, color: '#6b7280' },
  ];

  const paymentStatusData = [
    { name: 'Paid', value: summary.totalCollected, color: '#10b981' },
    { name: 'Outstanding', value: summary.totalOutstanding, color: '#f59e0b' },
    { name: 'Overdue', value: summary.totalOverdue, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{reportConfig.title}</CardTitle>
              <CardDescription>{reportConfig.description}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {reportConfig.dateRange.replace('-', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Billed</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalBilled)}</p>
              <p className="text-xs text-muted-foreground">{summary.totalInvoices} invoices</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Collected</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalCollected)}</p>
              <p className="text-xs text-green-600">
                {summary.collectionRate.toFixed(1)}% collection rate
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Outstanding</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalOutstanding)}</p>
              <p className="text-xs text-muted-foreground">Pending collection</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Overdue</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalOverdue)}</p>
              <p className="text-xs text-red-600">Requires attention</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Distribution of payment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* A/R Aging */}
        <Card>
          <CardHeader>
            <CardTitle>A/R Aging Analysis</CardTitle>
            <CardDescription>Outstanding amounts by age</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="hsl(var(--primary))">
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Trends</CardTitle>
            <CardDescription>Monthly paid vs unpaid amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends.paymentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="paid" fill="#10b981" name="Paid" />
                <Bar dataKey="unpaid" fill="#f59e0b" name="Unpaid" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Clients by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClients.slice(0, 5).map((client, index) => (
                <div key={client.clientId} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{client.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.invoiceCount} invoices • Avg. {client.averagePaymentDays.toFixed(0)} days to pay
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(client.totalBilled)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(client.totalPaid)} collected
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products/Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topItems.slice(0, 5).map((item, index) => (
                <div key={item.itemName} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity.toFixed(0)} • Avg: {formatCurrency(item.averagePrice)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Narrative Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
          <CardDescription>
            Automated analysis of your business performance with actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {narrative.keyInsights.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Key Insights
              </h4>
              <ul className="space-y-2">
                {narrative.keyInsights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {narrative.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {narrative.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {narrative.risks.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Risk Factors
              </h4>
              <ul className="space-y-2">
                {narrative.risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {narrative.opportunities.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Growth Opportunities
              </h4>
              <ul className="space-y-2">
                {narrative.opportunities.map((opp, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{opp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};