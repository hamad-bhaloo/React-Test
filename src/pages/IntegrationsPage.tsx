
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Link2, 
  CheckCircle, 
  Clock, 
  Settings,
  ExternalLink,
  Zap,
  Building2,
  Calculator,
  CreditCard,
  FileSpreadsheet,
  Users,
  Receipt,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'accounting' | 'payment' | 'crm' | 'analytics' | 'tax';
  icon: React.ReactNode;
  status: 'connected' | 'available' | 'coming_soon';
  isEnabled?: boolean;
  features: string[];
}

const IntegrationsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch user integrations
  const { data: userIntegrations, isLoading } = useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings_data')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      return (data?.settings_data as any)?.integrations || {};
    },
    enabled: !!user?.id,
  });

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'quickbooks',
      name: 'QuickBooks Online',
      description: 'Sync your invoices and financial data with QuickBooks Online',
      category: 'accounting',
      icon: <Building2 className="h-6 w-6" />,
      status: 'available',
      features: ['Invoice sync', 'Customer sync', 'Payment tracking', 'Financial reports']
    },
    {
      id: 'xero',
      name: 'Xero',
      description: 'Connect with Xero for seamless accounting integration',
      category: 'accounting',
      icon: <Calculator className="h-6 w-6" />,
      status: 'available',
      features: ['Real-time sync', 'Bank reconciliation', 'Tax reporting', 'Multi-currency']
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept online payments directly through your invoices',
      category: 'payment',
      icon: <CreditCard className="h-6 w-6" />,
      status: 'connected',
      isEnabled: true,
      features: ['Online payments', 'Automatic reconciliation', 'Subscription billing', 'Global payments']
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Enable PayPal payments for your customers',
      category: 'payment',
      icon: <CreditCard className="h-6 w-6" />,
      status: 'available',
      features: ['PayPal payments', 'PayPal Credit', 'Express checkout', 'Mobile payments']
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Automate workflows with 5000+ apps through Zapier',
      category: 'analytics',
      icon: <Zap className="h-6 w-6" />,
      status: 'available',
      features: ['Workflow automation', '5000+ app connections', 'Custom triggers', 'Multi-step workflows']
    },
    {
      id: 'excel',
      name: 'Microsoft Excel',
      description: 'Export and import data to/from Excel spreadsheets',
      category: 'analytics',
      icon: <FileSpreadsheet className="h-6 w-6" />,
      status: 'coming_soon',
      features: ['Data export', 'Bulk import', 'Custom templates', 'Automated reports']
    },
    {
      id: 'fbr',
      name: 'FBR (Federal Board of Revenue)',
      description: 'Submit invoices and comply with Pakistani tax regulations',
      category: 'tax',
      icon: <Shield className="h-6 w-6" />,
      status: 'available',
      features: ['Invoice submission to FBR', 'Tax compliance', 'Automatic validation', 'Digital receipts', 'Real-time status tracking']
    }
  ]);

  const connectQuickBooks = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { action: 'connect' }
      });
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      console.error('Error connecting to QuickBooks:', error);
      toast.error(error.message || 'Failed to connect to QuickBooks');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectFBR = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('fbr-setup', {
        body: { action: 'validate' }
      });
      
      if (error) throw error;
      
      toast.success('FBR integration configured successfully');
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === 'fbr' 
            ? { ...integration, status: 'connected' as const, isEnabled: true }
            : integration
        )
      );
    } catch (error: any) {
      console.error('Error connecting to FBR:', error);
      toast.error(error.message || 'Failed to connect to FBR');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async (integrationId: string) => {
    if (integrationId === 'quickbooks') {
      await connectQuickBooks();
      return;
    }
    
    if (integrationId === 'fbr') {
      await connectFBR();
      return;
    }
    
    toast.success(`${integrations.find(i => i.id === integrationId)?.name} connection initiated`);
    
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'connected' as const, isEnabled: true }
          : integration
      )
    );
  };

  const handleToggle = (integrationId: string, enabled: boolean) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, isEnabled: enabled }
          : integration
      )
    );
    
    const integration = integrations.find(i => i.id === integrationId);
    toast.success(`${integration?.name} ${enabled ? 'enabled' : 'disabled'}`);
  };

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'available':
        return <Badge variant="outline">Available</Badge>;
      case 'coming_soon':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><Clock className="h-3 w-3 mr-1" />Coming Soon</Badge>;
    }
  };

  const getCategoryIcon = (category: Integration['category']) => {
    switch (category) {
      case 'accounting':
        return <Building2 className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'crm':
        return <Users className="h-4 w-4" />;
      case 'analytics':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'tax':
        return <Receipt className="h-4 w-4" />;
    }
  };

  const categories = [
    { id: 'accounting', name: 'Accounting', description: 'Connect with popular accounting software' },
    { id: 'payment', name: 'Payments', description: 'Enable online payment processing' },
    { id: 'tax', name: 'Tax & Compliance', description: 'Comply with tax regulations and submit invoices' },
    { id: 'analytics', name: 'Analytics & Automation', description: 'Automate workflows and analyze data' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect X Invoice with your favorite tools and services to streamline your workflow.
        </p>
      </div>

      <Alert>
        <Link2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Connected integrations:</strong> {integrations.filter(i => i.status === 'connected').length} of {integrations.length} available integrations are connected.
        </AlertDescription>
      </Alert>

      {categories.map(category => {
        const categoryIntegrations = integrations.filter(i => i.category === category.id);
        
        return (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center space-x-2">
              {getCategoryIcon(category.id as Integration['category'])}
              <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
            </div>
            <p className="text-gray-600 -mt-2">{category.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryIntegrations.map(integration => (
                <Card key={integration.id} className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {integration.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          {getStatusBadge(integration.status)}
                        </div>
                      </div>
                      {integration.status === 'connected' && (
                        <Switch
                          checked={integration.isEnabled || false}
                          onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                        />
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {integration.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Features:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {integration.features.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="pt-2">
                        {integration.status === 'available' && (
                          <Button 
                            onClick={() => handleConnect(integration.id)}
                            className="w-full bg-orange-500 hover:bg-orange-600"
                          >
                            <Link2 className="h-4 w-4 mr-2" />
                            Connect
                          </Button>
                        )}
                        
                        {integration.status === 'connected' && (
                          <Button variant="outline" className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                        )}
                        
                        {integration.status === 'coming_soon' && (
                          <Button disabled className="w-full">
                            <Clock className="h-4 w-4 mr-2" />
                            Coming Soon
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <Zap className="h-5 w-5" />
            <span>Need a Custom Integration?</span>
          </CardTitle>
          <CardDescription className="text-orange-700">
            Don't see the integration you need? We can help you build custom connections to your existing tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
            <ExternalLink className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsPage;
