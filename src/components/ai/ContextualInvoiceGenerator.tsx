import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Clock, Target, Zap } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContextualInvoiceGeneratorProps {
  clientId?: string;
  onItemsGenerated: (items: any[]) => void;
}

interface ClientInsight {
  type: 'recent_service' | 'frequent_service' | 'seasonal_pattern' | 'rate_increase';
  title: string;
  description: string;
  suggestion: any;
  confidence: number;
  icon: React.ReactNode;
}

const ContextualInvoiceGenerator: React.FC<ContextualInvoiceGeneratorProps> = ({
  clientId,
  onItemsGenerated
}) => {
  const [insights, setInsights] = useState<ClientInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { data: clients = [] } = useClients();

  useEffect(() => {
    if (clientId && user) {
      generateInsights();
    }
  }, [clientId, user]);

  const generateInsights = async () => {
    if (!user || !clientId) return;

    setIsLoading(true);
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      // Get client's invoice history
      const { data: clientInvoices } = await supabase
        .from('invoices')
        .select(`
          id, total_amount, created_at, issue_date,
          invoice_items(product_name, description, rate, quantity, amount)
        `)
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!clientInvoices || clientInvoices.length === 0) {
        setInsights([{
          type: 'recent_service',
          title: 'New Client Opportunity',
          description: 'This is a new client. Consider offering your core services.',
          suggestion: {
            items: [{
              product_name: 'Initial Consultation',
              description: 'Discovery session and needs assessment',
              rate: 150,
              quantity: 1
            }]
          },
          confidence: 70,
          icon: <Target className="h-4 w-4 text-green-500" />
        }]);
        return;
      }

      const generatedInsights = await analyzeClientPatterns(client, clientInvoices);
      setInsights(generatedInsights);

    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeClientPatterns = async (client: any, invoices: any[]): Promise<ClientInsight[]> => {
    const insights: ClientInsight[] = [];
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Recent services pattern
    const recentInvoices = invoices.filter(inv => 
      new Date(inv.created_at) > oneMonthAgo
    );

    if (recentInvoices.length > 0) {
      const recentItems = recentInvoices.flatMap(inv => inv.invoice_items);
      const itemCounts = recentItems.reduce((acc, item) => {
        acc[item.product_name] = (acc[item.product_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostRecentService = Object.entries(itemCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];

      if (mostRecentService) {
        const [serviceName, count] = mostRecentService;
        const avgRate = recentItems
          .filter(item => item.product_name === serviceName)
          .reduce((sum, item) => sum + (Number(item.rate) || 0), 0) / (count as number);

        insights.push({
          type: 'recent_service',
          title: 'Repeat Recent Service',
          description: `${serviceName} was used ${count} time(s) recently`,
          suggestion: {
            items: [{
              product_name: serviceName,
              description: recentItems.find(item => item.product_name === serviceName)?.description || '',
              rate: Math.round(avgRate * 1.05), // 5% increase
              quantity: 1
            }]
          },
          confidence: 90,
          icon: <Clock className="h-4 w-4 text-blue-500" />
        });
      }
    }

    // 2. Most frequent services overall
    const allItems = invoices.flatMap(inv => inv.invoice_items);
    const serviceCounts = allItems.reduce((acc, item) => {
      const key = item.product_name;
      if (!acc[key]) {
        acc[key] = { count: 0, totalRate: 0, descriptions: [] };
      }
      acc[key].count++;
      acc[key].totalRate += Number(item.rate) || 0;
      if (item.description && !acc[key].descriptions.includes(item.description)) {
        acc[key].descriptions.push(item.description);
      }
      return acc;
    }, {} as Record<string, { count: number; totalRate: number; descriptions: string[] }>);

    const frequentService = Object.entries(serviceCounts)
      .sort(([,a], [,b]) => (b as any).count - (a as any).count)[0];

    if (frequentService && (frequentService[1] as any).count >= 2) {
      const [serviceName, data] = frequentService;
      const avgRate = (data as any).totalRate / (data as any).count;

      insights.push({
        type: 'frequent_service',
        title: 'Regular Service',
        description: `${serviceName} is your most frequent service for this client`,
        suggestion: {
          items: [{
            product_name: serviceName,
            description: (data as any).descriptions[0] || '',
            rate: Math.round(avgRate),
            quantity: 1
          }]
        },
        confidence: 85,
        icon: <TrendingUp className="h-4 w-4 text-orange-500" />
      });
    }

    // 3. Seasonal/timing patterns
    const currentMonth = now.getMonth();
    const seasonalInvoices = invoices.filter(inv => 
      new Date(inv.created_at).getMonth() === currentMonth
    );

    if (seasonalInvoices.length >= 2) {
      const seasonalItems = seasonalInvoices.flatMap(inv => inv.invoice_items);
      const seasonalService = seasonalItems.reduce((acc, item) => {
        acc[item.product_name] = (acc[item.product_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topSeasonalService = Object.entries(seasonalService)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];

      if (topSeasonalService) {
        const [serviceName] = topSeasonalService;
        const serviceData = seasonalItems.find(item => item.product_name === serviceName);

        insights.push({
          type: 'seasonal_pattern',
          title: 'Seasonal Service',
          description: `${serviceName} is typically requested this time of year`,
          suggestion: {
            items: [{
              product_name: serviceName,
              description: serviceData?.description || '',
              rate: serviceData?.rate || 0,
              quantity: 1
            }]
          },
          confidence: 75,
          icon: <Target className="h-4 w-4 text-purple-500" />
        });
      }
    }

    // 4. Rate optimization suggestion
    const lastInvoice = invoices[0];
    if (lastInvoice && lastInvoice.created_at) {
      const daysSinceLastInvoice = Math.floor(
        (now.getTime() - new Date(lastInvoice.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastInvoice > 90) {
        const lastItems = lastInvoice.invoice_items;
        const updatedItems = lastItems.map(item => ({
          ...item,
          rate: Math.round(item.rate * 1.1) // 10% increase after 90 days
        }));

        insights.push({
          type: 'rate_increase',
          title: 'Rate Update Opportunity',
          description: `It's been ${daysSinceLastInvoice} days since last invoice. Consider updated rates.`,
          suggestion: {
            items: updatedItems
          },
          confidence: 70,
          icon: <Zap className="h-4 w-4 text-green-600" />
        });
      }
    }

    return insights.slice(0, 3); // Limit to top 3 insights
  };

  const handleInsightSelect = (insight: ClientInsight) => {
    onItemsGenerated(insight.suggestion.items);
    toast.success(`Added ${insight.suggestion.items.length} item(s) based on ${insight.title.toLowerCase()}`);
  };

  if (!clientId) {
    return (
      <Card className="w-full opacity-50">
        <CardContent className="p-6 text-center">
          <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Select a client to see AI-powered invoice suggestions</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600">Analyzing client patterns...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Invoice Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No patterns found. This might be a new client or irregular billing pattern.
          </p>
        ) : (
          insights.map((insight, index) => (
            <div 
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => handleInsightSelect(insight)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {insight.icon}
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {insight.confidence}% confidence
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
              <div className="space-y-1">
                {insight.suggestion.items.map((item: any, itemIndex: number) => (
                  <div key={itemIndex} className="text-xs bg-gray-50 p-2 rounded">
                    <span className="font-medium">{item.product_name}</span>
                    {item.rate && <span className="text-gray-500 ml-2">${item.rate}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ContextualInvoiceGenerator;