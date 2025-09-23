import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmbedConfig {
  theme: 'light' | 'dark' | 'custom';
  primaryColor: string;
  borderRadius: string;
  showBranding: boolean;
  allowedDomains: string[];
  features: {
    createInvoice: boolean;
    viewInvoices: boolean;
    analytics: boolean;
  };
}

export default function EmbeddableInvoiceWidget() {
  const [config, setConfig] = useState<EmbedConfig>({
    theme: 'light',
    primaryColor: '#3b82f6',
    borderRadius: '8px',
    showBranding: true,
    allowedDomains: [],
    features: {
      createInvoice: true,
      viewInvoices: true,
      analytics: false,
    },
  });
  const [embedCode, setEmbedCode] = useState('');
  const [previewMode, setPreviewMode] = useState<'iframe' | 'widget' | 'sdk'>('widget');
  const { toast } = useToast();

  useEffect(() => {
    generateEmbedCode();
  }, [config, previewMode]);

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    
    switch (previewMode) {
      case 'iframe':
        setEmbedCode(`<iframe 
  src="${baseUrl}/embed/invoice-widget?config=${encodeURIComponent(JSON.stringify(config))}"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: ${config.borderRadius};"
></iframe>`);
        break;
      
      case 'widget':
        setEmbedCode(`<div id="invoice-widget-container"></div>
<script src="${baseUrl}/invoice-sdk.js"></script>
<script>
  const widget = new InvoiceWidget({
    containerId: 'invoice-widget-container',
    apiKey: 'YOUR_API_KEY', // Replace with your API key
    theme: {
      primaryColor: '${config.primaryColor}',
      borderRadius: '${config.borderRadius}',
      theme: '${config.theme}'
    },
    features: ${JSON.stringify(config.features, null, 2)},
    onInvoiceCreated: (invoice) => {
      console.log('Invoice created:', invoice);
    },
    onError: (error) => {
      console.error('Widget error:', error);
    }
  });
  
  // Render the widget
  ${config.features.createInvoice ? 'widget.renderCreateForm();' : ''}
  ${config.features.viewInvoices ? '// widget.renderInvoiceList();' : ''}
</script>`);
        break;
      
      case 'sdk':
        setEmbedCode(`// Install the SDK
<script src="${baseUrl}/invoice-sdk.js"></script>

<script>
// Initialize the SDK
const sdk = new InvoiceSDK({
  baseUrl: '${window.location.origin}',
  apiKey: 'YOUR_API_KEY' // Replace with your API key
});

// Example: Create an invoice
async function createInvoice() {
  try {
    const invoice = await sdk.createInvoice({
      client_id: 'client_uuid',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '2024-12-31',
      total_amount: 1000,
      items: [{
        product_name: 'Web Development Services',
        description: 'Custom web application development',
        quantity: 1,
        rate: 1000,
        amount: 1000
      }]
    });
    
    console.log('Invoice created:', invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
  }
}

// Example: Get all invoices
async function getInvoices() {
  try {
    const response = await sdk.getInvoices({ page: 1, limit: 10 });
    console.log('Invoices:', response.data);
  } catch (error) {
    console.error('Error fetching invoices:', error);
  }
}
</script>`);
        break;
    }
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast({
      title: 'Embed code copied',
      description: 'The embed code has been copied to your clipboard',
    });
  };

  const updateConfig = (key: keyof EmbedConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateFeature = (feature: keyof EmbedConfig['features'], enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: enabled }
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Embeddable Invoice Widget</h1>
        <p className="text-muted-foreground">
          Generate embed codes to integrate invoice functionality into any website
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Widget Configuration</CardTitle>
              <CardDescription>
                Customize the appearance and functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={config.theme} onValueChange={(value: any) => updateConfig('theme', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => updateConfig('primaryColor', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="borderRadius">Border Radius</Label>
                <Select value={config.borderRadius} onValueChange={(value) => updateConfig('borderRadius', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0px">None</SelectItem>
                    <SelectItem value="4px">Small</SelectItem>
                    <SelectItem value="8px">Medium</SelectItem>
                    <SelectItem value="12px">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Features</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Create Invoice</span>
                    <input
                      type="checkbox"
                      checked={config.features.createInvoice}
                      onChange={(e) => updateFeature('createInvoice', e.target.checked)}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">View Invoices</span>
                    <input
                      type="checkbox"
                      checked={config.features.viewInvoices}
                      onChange={(e) => updateFeature('viewInvoices', e.target.checked)}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytics</span>
                    <input
                      type="checkbox"
                      checked={config.features.analytics}
                      onChange={(e) => updateFeature('analytics', e.target.checked)}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Show Branding</Label>
                <input
                  type="checkbox"
                  checked={config.showBranding}
                  onChange={(e) => updateConfig('showBranding', e.target.checked)}
                  className="rounded"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview and Code */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Integration Options</CardTitle>
                  <CardDescription>
                    Choose how you want to integrate the invoice system
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/api-docs" target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      API Docs
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={previewMode} onValueChange={(value: any) => setPreviewMode(value)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="widget">Widget</TabsTrigger>
                  <TabsTrigger value="iframe">iFrame</TabsTrigger>
                  <TabsTrigger value="sdk">JavaScript SDK</TabsTrigger>
                </TabsList>

                <TabsContent value="widget" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="default">Recommended</Badge>
                      <Button variant="outline" size="sm" onClick={copyEmbedCode}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Lightweight JavaScript widget with full customization options
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                        {embedCode}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="iframe" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">Simple</Badge>
                      <Button variant="outline" size="sm" onClick={copyEmbedCode}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Simple iframe integration for quick setup
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                        {embedCode}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sdk" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Advanced</Badge>
                      <Button variant="outline" size="sm" onClick={copyEmbedCode}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Full JavaScript SDK for complete programmatic control
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                        {embedCode}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Usage Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Examples</CardTitle>
              <CardDescription>
                Common integration patterns and use cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">E-commerce Store</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Automatically generate invoices after order completion
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Widget + Webhooks
                  </Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Client Portal</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Allow clients to view and pay invoices directly
                  </p>
                  <Badge variant="outline" className="text-xs">
                    iFrame
                  </Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">CRM Integration</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sync invoices with your existing CRM system
                  </p>
                  <Badge variant="outline" className="text-xs">
                    API + SDK
                  </Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Mobile App</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create and manage invoices from mobile applications
                  </p>
                  <Badge variant="outline" className="text-xs">
                    REST API
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}