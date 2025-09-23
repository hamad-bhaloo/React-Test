import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Filter, 
  Download, 
  Eye,
  Settings,
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  Clock
} from 'lucide-react';
import { ReportFilters } from './ReportFilters';
import { ReportPreview } from './ReportPreview';
import { ReportConfiguration } from './ReportConfiguration';
import { useReportBuilder } from '@/hooks/useReportBuilder';

export const ReportBuilder = () => {
  const [step, setStep] = useState<'configure' | 'preview' | 'export'>('configure');
  const {
    reportConfig,
    reportData,
    updateConfig,
    generateReport,
    exportReport,
    isGenerating,
    isExporting
  } = useReportBuilder();

  const steps = [
    { id: 'configure', label: 'Configure', icon: Settings },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'export', label: 'Export', icon: Download }
  ];

  const handleNext = async () => {
    if (step === 'configure') {
      setStep('preview');
      await generateReport();
    } else if (step === 'preview') {
      setStep('export');
    }
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('configure');
    } else if (step === 'export') {
      setStep('preview');
    }
  };

  // Use real data from reportData if available, otherwise show loading
  const quickStats = reportData ? [
    {
      label: 'Total Revenue',
      value: `$${reportData.summary.totalBilled.toLocaleString()}`,
      change: `${reportData.summary.collectionRate.toFixed(1)}%`,
      icon: DollarSign,
      trend: 'up'
    },
    {
      label: 'Outstanding',
      value: `$${reportData.summary.totalOutstanding.toLocaleString()}`,
      change: reportData.summary.totalOverdue > 0 ? 'Overdue' : 'Current',
      icon: Clock,
      trend: reportData.summary.totalOverdue > 0 ? 'down' : 'up'
    },
    {
      label: 'Active Clients',
      value: reportData.topClients.length.toString(),
      change: `${reportData.summary.totalInvoices} invoices`,
      icon: Users,
      trend: 'up'
    },
    {
      label: 'Avg. Invoice',
      value: `$${(reportData.summary.totalBilled / Math.max(reportData.summary.totalInvoices, 1)).toFixed(0)}`,
      change: `${reportData.summary.totalInvoices} total`,
      icon: TrendingUp,
      trend: 'up'
    }
  ] : [
    {
      label: 'Total Revenue',
      value: 'Loading...',
      change: '...',
      icon: DollarSign,
      trend: 'up'
    },
    {
      label: 'Outstanding',
      value: 'Loading...',
      change: '...',
      icon: Clock,
      trend: 'up'
    },
    {
      label: 'Active Clients',
      value: 'Loading...',
      change: '...',
      icon: Users,
      trend: 'up'
    },
    {
      label: 'Avg. Invoice',
      value: 'Loading...',
      change: '...',
      icon: TrendingUp,
      trend: 'up'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>
                Create professional reports with custom filters and visualizations
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {steps.map((stepItem, index) => (
                <Button
                  key={stepItem.id}
                  variant={step === stepItem.id ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                  onClick={() => setStep(stepItem.id as any)}
                >
                  <stepItem.icon className="h-4 w-4" />
                  {stepItem.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant={stat.trend === 'up' ? 'default' : 'secondary'}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {stat.change}
                    </Badge>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      {step === 'configure' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ReportConfiguration 
              config={reportConfig}
              onConfigChange={updateConfig}
            />
          </div>
          <div className="space-y-6">
            <ReportFilters 
              filters={reportConfig.filters}
              onFiltersChange={(filters) => updateConfig({ filters })}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Report Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Charts & Visualizations</span>
                  </div>
                  <Badge variant="secondary">5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Data Tables</span>
                  </div>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Narrative Analysis</span>
                  </div>
                  <Badge variant="secondary">Auto</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <ReportPreview />
      )}

      {step === 'export' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Choose your preferred export format and delivery method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Format Options</h4>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => exportReport('pdf')}
                      disabled={isExporting}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Professional PDF Report
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => exportReport('xlsx')}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Excel Spreadsheet (XLSX)
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => exportReport('csv')}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV Data Export
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Delivery Options</h4>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => exportReport('pdf')}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Now
                    </Button>
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Delivery (Coming Soon)
                    </Button>
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <Users className="h-4 w-4 mr-2" />
                      Share with Team (Coming Soon)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {step !== 'configure' && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            Save as Template
          </Button>
          {step !== 'export' ? (
            <Button onClick={handleNext} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Next'}
            </Button>
          ) : (
            <Button onClick={() => exportReport('pdf')} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};