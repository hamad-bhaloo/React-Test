import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  Users,
  Package,
  Calculator,
  Clock,
  FileText,
  Settings
} from 'lucide-react';

export const ReportTemplates = () => {
  const reportTemplates = [
    {
      id: 'executive-summary',
      name: 'Executive Summary',
      description: 'High-level overview of business performance',
      icon: TrendingUp,
      category: 'Overview',
      features: ['KPIs', 'Trends', 'Executive Charts', 'Narrative Analysis'],
      estimatedTime: '2 min',
      isAvailable: true
    },
    {
      id: 'ar-aging',
      name: 'A/R Aging Report',
      description: 'Accounts receivable aging analysis',
      icon: Clock,
      category: 'Financial',
      features: ['Aging Buckets', 'Client Breakdown', 'Risk Analysis', 'Collection Insights'],
      estimatedTime: '1 min',
      isAvailable: true
    },
    {
      id: 'client-performance',
      name: 'Client Performance',
      description: 'Detailed analysis of client relationships',
      icon: Users,
      category: 'Client Analysis',
      features: ['Revenue per Client', 'Payment Behavior', 'Growth Trends', 'Risk Assessment'],
      estimatedTime: '3 min',
      isAvailable: true
    },
    {
      id: 'item-performance',
      name: 'Item/Service Performance',
      description: 'Product and service profitability analysis',
      icon: Package,
      category: 'Product Analysis',
      features: ['Top Performers', 'Profitability', 'Trends', 'Recommendations'],
      estimatedTime: '2 min',
      isAvailable: true
    },
    {
      id: 'tax-summary',
      name: 'Tax Summary',
      description: 'Comprehensive tax reporting and analysis',
      icon: Calculator,
      category: 'Tax & Compliance',
      features: ['Tax Collected', 'By Period', 'Client Breakdown', 'Compliance Check'],
      estimatedTime: '1 min',
      isAvailable: true
    },
    {
      id: 'year-end-pack',
      name: 'Year-End Pack',
      description: 'Complete annual financial package',
      icon: FileText,
      category: 'Annual',
      features: ['Full P&L', 'Client Statements', 'Tax Reports', 'Executive Summary'],
      estimatedTime: '5 min',
      isAvailable: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Report Templates</h2>
          <p className="text-muted-foreground">
            Choose from pre-built templates designed for comprehensive business insights
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Create Custom Template
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <template.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {template.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {template.category}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  ~{template.estimatedTime}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground">Features:</div>
                <div className="flex flex-wrap gap-1">
                  {template.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs px-2 py-0.5">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1" 
                  disabled={!template.isAvailable}
                  onClick={() => {
                    // This would set the template and redirect to report builder
                    console.log('Using template:', template.id);
                  }}
                >
                  {template.isAvailable ? 'Use Template' : 'Coming Soon'}
                </Button>
                <Button size="sm" variant="outline" disabled={!template.isAvailable}>
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};