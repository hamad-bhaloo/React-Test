import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Clock, Target } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SmartAutoCompleteProps {
  clientId?: string;
  onSuggestionSelect: (suggestion: any) => void;
  type: 'product' | 'service' | 'rate' | 'description';
  currentValue: string;
}

interface Suggestion {
  text: string;
  confidence: number;
  reason: string;
  icon: React.ReactNode;
}

const SmartAutoComplete: React.FC<SmartAutoCompleteProps> = ({
  clientId,
  onSuggestionSelect,
  type,
  currentValue
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { data: clients = [] } = useClients();

  useEffect(() => {
    if (clientId && user && currentValue.length >= 2) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [clientId, currentValue, user]);

  const generateSuggestions = async () => {
    if (!user || !clientId) return;

    setIsLoading(true);
    try {
      // Get client data
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      // Get historical data for this client
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          invoice_items(product_name, description, rate, quantity),
          created_at
        `)
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get general patterns from user's invoices
      const { data: allInvoices } = await supabase
        .from('invoices')
        .select(`
          invoice_items(product_name, description, rate, quantity),
          clients(industry, client_type)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const generatedSuggestions = generateSmartSuggestions(
        type,
        currentValue,
        client,
        invoices,
        allInvoices
      );

      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSmartSuggestions = (
    type: string,
    value: string,
    client: any,
    clientHistory: any[],
    allHistory: any[]
  ): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    if (type === 'product') {
      // Previous products for this client
      const clientProducts = clientHistory
        ?.flatMap(inv => inv.invoice_items || [])
        .map(item => item.product_name)
        .filter(name => name && name.toLowerCase().includes(value.toLowerCase()));

      const uniqueClientProducts = [...new Set(clientProducts)].slice(0, 3);
      
      uniqueClientProducts.forEach(product => {
        suggestions.push({
          text: product,
          confidence: 95,
          reason: 'Previously used for this client',
          icon: <Clock className="h-3 w-3 text-blue-500" />
        });
      });

      // Industry-specific suggestions
      if (client.industry) {
        const industryProducts = getIndustryProducts(client.industry, value);
        industryProducts.forEach(product => {
          suggestions.push({
            text: product,
            confidence: 80,
            reason: `Common in ${client.industry}`,
            icon: <Target className="h-3 w-3 text-green-500" />
          });
        });
      }

      // Popular products across all clients
      const allProducts = allHistory
        ?.flatMap(inv => inv.invoice_items || [])
        .map(item => item.product_name)
        .filter(name => name && name.toLowerCase().includes(value.toLowerCase()));

      const productCounts = allProducts.reduce((acc, product) => {
        acc[product] = (acc[product] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const popularProducts = Object.entries(productCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 2)
        .map(([product]) => product);

      popularProducts.forEach(product => {
        if (!suggestions.find(s => s.text === product)) {
          suggestions.push({
            text: product,
            confidence: 70,
            reason: 'Frequently used service',
            icon: <TrendingUp className="h-3 w-3 text-orange-500" />
          });
        }
      });
    }

    if (type === 'rate') {
      // Get average rates for similar products
      const similarItems = allHistory
        ?.flatMap(inv => inv.invoice_items || [])
        .filter(item => 
          item.product_name && 
          currentValue && 
          item.product_name.toLowerCase().includes(currentValue.toLowerCase())
        );

      if (similarItems.length > 0) {
        const avgRate = similarItems.reduce((sum, item) => sum + (Number(item.rate) || 0), 0) / similarItems.length;
        const roundedRate = Math.round(avgRate * 100) / 100;

        suggestions.push({
          text: roundedRate.toString(),
          confidence: 85,
          reason: 'Average rate for similar services',
          icon: <TrendingUp className="h-3 w-3 text-green-500" />
        });
      }

      // Industry standard rates
      if (client.industry) {
        const industryRates = getIndustryRates(client.industry, currentValue);
        industryRates.forEach(rate => {
          suggestions.push({
            text: rate.toString(),
            confidence: 75,
            reason: `${client.industry} industry standard`,
            icon: <Target className="h-3 w-3 text-blue-500" />
          });
        });
      }
    }

    if (type === 'description') {
      // Get common descriptions for the current product
      const similarDescriptions = allHistory
        ?.flatMap(inv => inv.invoice_items || [])
        .filter(item => 
          item.product_name && 
          currentValue &&
          item.product_name.toLowerCase().includes(currentValue.toLowerCase())
        )
        .map(item => item.description)
        .filter(desc => desc);

      const uniqueDescriptions = [...new Set(similarDescriptions)].slice(0, 3);
      
      uniqueDescriptions.forEach(desc => {
        suggestions.push({
          text: desc,
          confidence: 80,
          reason: 'Common description for this service',
          icon: <Clock className="h-3 w-3 text-purple-500" />
        });
      });
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  const getIndustryProducts = (industry: string, filter: string): string[] => {
    const industryMap: Record<string, string[]> = {
      'technology': ['Web Development', 'Mobile App Development', 'Software Consulting', 'Technical Support', 'System Integration'],
      'marketing': ['Digital Marketing Campaign', 'SEO Services', 'Social Media Management', 'Content Creation', 'Brand Strategy'],
      'design': ['Logo Design', 'Website Design', 'Graphic Design', 'UI/UX Design', 'Print Design'],
      'consulting': ['Business Consulting', 'Strategy Development', 'Process Improvement', 'Project Management', 'Training'],
      'legal': ['Legal Consultation', 'Contract Review', 'Document Preparation', 'Compliance Review', 'Legal Research'],
      'finance': ['Financial Planning', 'Tax Preparation', 'Bookkeeping', 'Audit Services', 'Investment Advice']
    };

    const products = industryMap[industry.toLowerCase()] || [];
    return products.filter(product => 
      product.toLowerCase().includes(filter.toLowerCase())
    ).slice(0, 2);
  };

  const getIndustryRates = (industry: string, service: string): number[] => {
    // This would ideally come from market data
    const rateMap: Record<string, Record<string, number[]>> = {
      'technology': {
        'development': [75, 100, 125],
        'consulting': [150, 200, 250],
        'support': [50, 75, 100]
      },
      'marketing': {
        'campaign': [1000, 2500, 5000],
        'seo': [500, 1000, 1500],
        'content': [50, 100, 150]
      },
      'design': {
        'logo': [500, 1000, 2000],
        'website': [2000, 5000, 10000],
        'graphic': [100, 250, 500]
      }
    };

    const serviceKey = Object.keys(rateMap[industry.toLowerCase()] || {})
      .find(key => service.toLowerCase().includes(key));

    return serviceKey ? rateMap[industry.toLowerCase()][serviceKey] : [];
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <span className="text-xs font-medium text-blue-800">AI Suggestions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Badge
            key={index}
            variant="outline"
            className="cursor-pointer hover:bg-blue-100 transition-colors text-xs p-2 flex items-center gap-1"
            onClick={() => onSuggestionSelect(suggestion)}
          >
            {suggestion.icon}
            <span className="font-medium">{suggestion.text}</span>
            <span className="text-gray-500">({suggestion.confidence}%)</span>
          </Badge>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-1">
        💡 Click on suggestions to auto-fill. Based on {suggestions[0]?.reason.toLowerCase()}.
      </p>
    </div>
  );
};

export default SmartAutoComplete;