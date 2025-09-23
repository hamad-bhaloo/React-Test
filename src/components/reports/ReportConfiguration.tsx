import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Palette, 
  BarChart3, 
  FileText, 
  Image,
  Layout
} from 'lucide-react';
import { ReportConfig } from '@/hooks/useReportBuilder';

interface ReportConfigurationProps {
  config: ReportConfig;
  onConfigChange: (updates: Partial<ReportConfig>) => void;
}

export const ReportConfiguration: React.FC<ReportConfigurationProps> = ({
  config,
  onConfigChange
}) => {
  const updateField = (field: keyof ReportConfig, value: any) => {
    onConfigChange({ [field]: value });
  };

  const updateNestedField = (parent: keyof ReportConfig, field: string, value: any) => {
    onConfigChange({
      [parent]: {
        ...(config[parent] as any),
        [field]: value
      }
    });
  };

  const templateOptions = [
    { value: 'executive-summary', label: 'Executive Summary' },
    { value: 'ar-aging', label: 'A/R Aging Report' },
    { value: 'client-performance', label: 'Client Performance' },
    { value: 'item-performance', label: 'Item/Service Performance' },
    { value: 'tax-summary', label: 'Tax Summary' },
    { value: 'year-end-pack', label: 'Year-End Pack' },
    { value: 'custom', label: 'Custom Report' }
  ];

  const chartOptions = [
    { id: 'revenue-trends', label: 'Revenue Trends' },
    { id: 'payment-status', label: 'Payment Status Distribution' },
    { id: 'aging-analysis', label: 'A/R Aging Analysis' },
    { id: 'client-analysis', label: 'Client Performance' },
    { id: 'item-analysis', label: 'Product/Service Analysis' },
    { id: 'monthly-comparison', label: 'Monthly Comparison' },
    { id: 'seasonal-trends', label: 'Seasonal Trends' },
    { id: 'payment-methods', label: 'Payment Methods' }
  ];

  const tableOptions = [
    { id: 'top-clients', label: 'Top Clients' },
    { id: 'recent-invoices', label: 'Recent Invoices' },
    { id: 'overdue-invoices', label: 'Overdue Invoices' },
    { id: 'top-items', label: 'Top Products/Services' },
    { id: 'payment-history', label: 'Payment History' },
    { id: 'client-statements', label: 'Client Statements' },
    { id: 'tax-breakdown', label: 'Tax Breakdown' },
    { id: 'summary-statistics', label: 'Summary Statistics' }
  ];

  const themeOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'colorful', label: 'Colorful' }
  ];

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Enter report title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select 
                value={config.template} 
                onValueChange={(value) => updateField('template', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description of the report"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Components Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Report Components
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Charts */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Charts & Visualizations</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {chartOptions.map((chart) => (
                <div key={chart.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={chart.id}
                    checked={config.components.charts.includes(chart.id)}
                    onCheckedChange={(checked) => {
                      const newCharts = checked
                        ? [...config.components.charts, chart.id]
                        : config.components.charts.filter(id => id !== chart.id);
                      updateNestedField('components', 'charts', newCharts);
                    }}
                  />
                  <Label htmlFor={chart.id} className="text-sm">
                    {chart.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tables */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Data Tables</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {tableOptions.map((table) => (
                <div key={table.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={table.id}
                    checked={config.components.tables.includes(table.id)}
                    onCheckedChange={(checked) => {
                      const newTables = checked
                        ? [...config.components.tables, table.id]
                        : config.components.tables.filter(id => id !== table.id);
                      updateNestedField('components', 'tables', newTables);
                    }}
                  />
                  <Label htmlFor={table.id} className="text-sm">
                    {table.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Additional Components */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Additional Components</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="narrativeAnalysis"
                  checked={config.components.narrativeAnalysis}
                  onCheckedChange={(checked) => 
                    updateNestedField('components', 'narrativeAnalysis', checked)
                  }
                />
                <Label htmlFor="narrativeAnalysis" className="text-sm">
                  AI-Generated Narrative Analysis
                </Label>
                <Badge variant="secondary" className="text-xs">AI</Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="coverPage"
                  checked={config.components.coverPage}
                  onCheckedChange={(checked) => 
                    updateNestedField('components', 'coverPage', checked)
                  }
                />
                <Label htmlFor="coverPage" className="text-sm">
                  Cover Page
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tableOfContents"
                  checked={config.components.tableOfContents}
                  onCheckedChange={(checked) => 
                    updateNestedField('components', 'tableOfContents', checked)
                  }
                />
                <Label htmlFor="tableOfContents" className="text-sm">
                  Table of Contents
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="appendices"
                  checked={config.components.appendices}
                  onCheckedChange={(checked) => 
                    updateNestedField('components', 'appendices', checked)
                  }
                />
                <Label htmlFor="appendices" className="text-sm">
                  Appendices with Raw Data
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Styling Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Styling & Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={config.styling.theme} 
                onValueChange={(value) => updateNestedField('styling', 'theme', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo URL</Label>
              <Input
                id="logo"
                value={config.styling.logo}
                onChange={(e) => updateNestedField('styling', 'logo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="watermark">Watermark Text</Label>
            <Input
              id="watermark"
              value={config.styling.watermark}
              onChange={(e) => updateNestedField('styling', 'watermark', e.target.value)}
              placeholder="CONFIDENTIAL or company name"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="headerFooter"
              checked={config.styling.headerFooter}
              onCheckedChange={(checked) => 
                updateNestedField('styling', 'headerFooter', checked)
              }
            />
            <Label htmlFor="headerFooter" className="text-sm">
              Include branded headers and footers
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};