import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  TrendingUp,
  Users,
  DollarSign,
  Download,
  Loader2,
  Calendar,
  PieChart,
  BarChart3,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useReportBuilder } from '@/hooks/useReportBuilder';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ReportsPage = () => {
  const { reportData, exportReport, isExporting, generateReport, isGenerating, reportConfig, updateConfig } = useReportBuilder();
  const [selectedPeriod, setSelectedPeriod] = useState('last-12-months');
  const [activeView, setActiveView] = useState('dashboard');

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    updateConfig({ dateRange: period });
    generateReport();
  };

  const handleDownload = (format: 'pdf' | 'csv') => {
    if (!reportData) {
      toast.error('Please wait for report data to load');
      return;
    }
    exportReport(format);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Intelligence</h1>
          <p className="text-muted-foreground">Comprehensive financial reporting and analytics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-3-months">Last 3 months</SelectItem>
              <SelectItem value="last-6-months">Last 6 months</SelectItem>
              <SelectItem value="last-12-months">Last 12 months</SelectItem>
              <SelectItem value="this-year">This year</SelectItem>
              <SelectItem value="last-year">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDownload('pdf')}
              disabled={isExporting || !reportData}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDownload('csv')}
              disabled={isExporting || !reportData}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              CSV
            </Button>
          </div>
        </div>
      </div>

      {isGenerating && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Generating comprehensive financial reports...</p>
          </CardContent>
        </Card>
      )}

      {reportData && (
        <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Financial</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Clients</span>
            </TabsTrigger>
            <TabsTrigger value="aging" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Aging</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(reportData.summary.totalBilled)}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {reportData.summary.totalInvoices} invoices
                      </Badge>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Collections</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(reportData.summary.totalCollected)}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {reportData.summary.collectionRate.toFixed(1)}% rate
                      </Badge>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                      <p className="text-3xl font-bold text-amber-600">
                        {formatCurrency(reportData.summary.totalOutstanding)}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending payment
                      </Badge>
                    </div>
                    <Clock className="h-8 w-8 text-amber-600/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                      <p className="text-3xl font-bold text-red-600">
                        {formatCurrency(reportData.summary.totalOverdue)}
                      </p>
                      <Badge variant="destructive" className="mt-2">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Average Invoice Value</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(reportData.summary.averageInvoiceValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Collection Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {reportData.summary.collectionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Active Clients</span>
                    <span className="text-lg font-bold text-blue-600">
                      {reportData.topClients.length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Performing Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.topClients.slice(0, 5).map((client, index) => (
                      <div key={client.clientId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{client.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.invoiceCount} invoices
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(client.totalBilled)}</p>
                          <Badge variant={client.totalPaid === client.totalBilled ? "default" : "secondary"} className="text-xs">
                            {((client.totalPaid / client.totalBilled) * 100).toFixed(0)}% paid
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">Total Billed</span>
                      <span className="font-bold text-primary">{formatCurrency(reportData.summary.totalBilled)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">Amount Collected</span>
                      <span className="font-bold text-green-600">{formatCurrency(reportData.summary.totalCollected)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">Outstanding Balance</span>
                      <span className="font-bold text-amber-600">{formatCurrency(reportData.summary.totalOutstanding)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium">Overdue Amount</span>
                      <span className="font-bold text-red-600">{formatCurrency(reportData.summary.totalOverdue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Health Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">Collection Efficiency</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{reportData.summary.collectionRate.toFixed(1)}%</p>
                      <p className="text-xs text-green-600 mt-1">
                        {reportData.summary.collectionRate >= 85 ? 'Excellent' : 
                         reportData.summary.collectionRate >= 70 ? 'Good' : 'Needs Improvement'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Average Invoice Value</span>
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.summary.averageInvoiceValue)}</p>
                      <p className="text-xs text-blue-600 mt-1">Per transaction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-sm">Client</th>
                        <th className="text-right py-3 px-2 font-medium text-sm">Total Billed</th>
                        <th className="text-right py-3 px-2 font-medium text-sm">Amount Paid</th>
                        <th className="text-right py-3 px-2 font-medium text-sm">Invoices</th>
                        <th className="text-right py-3 px-2 font-medium text-sm">Avg Pay Days</th>
                        <th className="text-center py-3 px-2 font-medium text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.topClients.map((client) => (
                        <tr key={client.clientId} className="border-b hover:bg-muted/30">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium text-sm">{client.clientName}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right font-medium">
                            {formatCurrency(client.totalBilled)}
                          </td>
                          <td className="py-3 px-2 text-right font-medium text-green-600">
                            {formatCurrency(client.totalPaid)}
                          </td>
                          <td className="py-3 px-2 text-right">{client.invoiceCount}</td>
                          <td className="py-3 px-2 text-right">{Math.round(client.averagePaymentDays)} days</td>
                          <td className="py-3 px-2 text-center">
                            <Badge 
                              variant={client.totalPaid === client.totalBilled ? "default" : 
                                      client.totalPaid > 0 ? "secondary" : "outline"}
                            >
                              {client.totalPaid === client.totalBilled ? "Paid" : 
                               client.totalPaid > 0 ? "Partial" : "Outstanding"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aging" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Accounts Receivable Aging</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <span className="font-medium">Current (0-30 days)</span>
                      <span className="font-bold text-green-600">{formatCurrency(reportData.aging.current)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <span className="font-medium">31-60 days</span>
                      <span className="font-bold text-yellow-600">{formatCurrency(reportData.aging.days30)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <span className="font-medium">61-90 days</span>
                      <span className="font-bold text-orange-600">{formatCurrency(reportData.aging.days60)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <span className="font-medium">91+ days</span>
                      <span className="font-bold text-red-600">{formatCurrency(reportData.aging.days90 + reportData.aging.over90)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Collection Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.aging.over90 > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-red-800 dark:text-red-200">Critical</p>
                            <p className="text-sm text-red-600">90+ days overdue</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{formatCurrency(reportData.aging.over90)}</p>
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-1" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {reportData.aging.days90 > 0 && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-orange-800 dark:text-orange-200">High Priority</p>
                            <p className="text-sm text-orange-600">61-90 days overdue</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-600">{formatCurrency(reportData.aging.days90)}</p>
                            <Clock className="h-4 w-4 text-orange-600 mt-1" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground text-center">
                        {reportData.aging.over90 === 0 && reportData.aging.days90 === 0 
                          ? "No critical collections required" 
                          : "Focus collection efforts on items above"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ReportsPage;