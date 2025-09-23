import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Code, 
  Copy, 
  ExternalLink, 
  Download, 
  Key, 
  Shield, 
  Zap, 
  Book, 
  Globe, 
  Terminal,
  CheckCircle,
  ArrowRight,
  Github,
  FileCode,
  Settings,
  Webhook
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ApiKeyManager from '@/components/api/ApiKeyManager';

export default function ApiDocumentationPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('invoices');
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Code example has been copied to your clipboard',
    });
  };

  const downloadSDK = () => {
    const link = document.createElement('a');
    link.href = '/invoice-sdk.js';
    link.download = 'invoice-sdk.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'SDK Downloaded',
      description: 'JavaScript SDK has been downloaded to your device',
    });
  };

  const endpoints = {
    invoices: {
      title: 'Invoices API',
      description: 'Complete invoice management and automation',
      icon: FileCode,
      methods: [
        {
          method: 'GET',
          path: '/api-invoices/invoices',
          description: 'Retrieve all invoices with pagination and filtering',
          params: ['page', 'limit', 'status', 'client_id', 'date_from', 'date_to'],
          response: `{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "invoice_number": "INV-2024-0001",
      "total_amount": 2500.00,
      "status": "sent",
      "issue_date": "2024-01-01",
      "due_date": "2024-01-15",
      "payment_terms": "Net 15",
      "currency": "USD",
      "client": {
        "id": "client_uuid",
        "name": "Enterprise Corp",
        "email": "billing@enterprise.com",
        "company": "Enterprise Corporation"
      },
      "items": [
        {
          "product_name": "Professional Services",
          "description": "Custom software development",
          "quantity": 40,
          "rate": 62.50,
          "amount": 2500.00,
          "tax_rate": 0.08
        }
      ],
      "metadata": {
        "project_id": "proj_123",
        "department": "IT"
      },
      "created_at": "2024-01-01T10:30:00Z",
      "updated_at": "2024-01-01T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 247,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "summary": {
    "total_amount": 125000.00,
    "paid_amount": 87500.00,
    "pending_amount": 37500.00
  }
}`
        },
        {
          method: 'POST',
          path: '/api-invoices/invoices',
          description: 'Create a new invoice with advanced options',
          body: `{
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "invoice_template": "professional",
  "issue_date": "2024-01-01",
  "due_date": "2024-01-15",
  "payment_terms": "Net 15",
  "currency": "USD",
  "tax_percentage": 8.25,
  "discount_amount": 100.00,
  "shipping_charge": 25.00,
  "notes": "Thank you for your business",
  "items": [
    {
      "product_name": "Professional Consulting",
      "description": "Strategic business consulting services",
      "quantity": 20,
      "rate": 150.00,
      "amount": 3000.00,
      "tax_exempt": false
    },
    {
      "product_name": "Implementation Support",
      "description": "Technical implementation and setup",
      "quantity": 10,
      "rate": 200.00,
      "amount": 2000.00,
      "tax_exempt": false
    }
  ],
  "metadata": {
    "project_id": "proj_456",
    "purchase_order": "PO-2024-001",
    "department": "Consulting"
  },
  "auto_send": true,
  "send_reminder": true,
  "webhook_url": "https://your-app.com/webhooks/invoice"
}`,
          response: `{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "INV-2024-0002",
  "status": "sent",
  "total_amount": 5043.75,
  "subtotal": 5000.00,
  "tax_amount": 368.75,
  "discount_amount": 100.00,
  "shipping_charge": 25.00,
  "public_url": "https://invoice.example.com/public/inv_abc123",
  "payment_url": "https://pay.example.com/inv_abc123",
  "pdf_url": "https://invoice.example.com/pdf/inv_abc123.pdf",
  "created_at": "2024-01-01T14:22:00Z",
  "sent_at": "2024-01-01T14:22:15Z"
}`
        },
        {
          method: 'PUT',
          path: '/api-invoices/invoices/{id}',
          description: 'Update an existing invoice',
          response: `{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "updated",
  "updated_at": "2024-01-01T15:45:00Z"
}`
        },
        {
          method: 'POST',
          path: '/api-invoices/invoices/{id}/send',
          description: 'Send invoice via email to client',
          response: `{
  "success": true,
  "message": "Invoice sent successfully",
  "sent_at": "2024-01-01T16:30:00Z",
  "email": "client@enterprise.com"
}`
        }
      ]
    },
    clients: {
      title: 'Clients API',
      description: 'Customer relationship and data management',
      icon: Globe,
      methods: [
        {
          method: 'GET',
          path: '/api-invoices/clients',
          description: 'List all clients with advanced filtering',
          params: ['page', 'limit', 'search', 'company', 'country'],
          response: `{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Enterprise",
      "email": "john@enterprise.com",
      "company": "Enterprise Solutions Ltd",
      "phone": "+1-555-0123",
      "address": "123 Business Ave, Suite 100",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "country": "United States",
      "tax_id": "US123456789",
      "currency_preference": "USD",
      "payment_terms": "Net 30",
      "credit_limit": 50000.00,
      "current_balance": 12500.00,
      "total_invoices": 24,
      "total_paid": 125000.00,
      "last_invoice_date": "2024-01-01",
      "created_at": "2023-06-15T09:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 156,
    "totalPages": 7
  }
}`
        },
        {
          method: 'POST',
          path: '/api-invoices/clients',
          description: 'Create a new client with comprehensive data',
          body: `{
  "name": "Jane Corporate",
  "email": "jane@corporate.com",
  "company": "Corporate Solutions Inc",
  "phone": "+1-555-0456",
  "website": "https://corporate.com",
  "address": "456 Corporate Blvd",
  "address_line_2": "Floor 15",
  "city": "Los Angeles",
  "state": "CA",
  "zip_code": "90210",
  "country": "United States",
  "tax_id": "US987654321",
  "currency_preference": "USD",
  "payment_terms": "Net 15",
  "credit_limit": 25000.00,
  "billing_contact": {
    "name": "Finance Team",
    "email": "billing@corporate.com",
    "phone": "+1-555-0789"
  },
  "metadata": {
    "industry": "Technology",
    "size": "Enterprise",
    "source": "Website"
  }
}`,
          response: `{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Jane Corporate",
  "email": "jane@corporate.com",
  "company": "Corporate Solutions Inc",
  "created_at": "2024-01-01T16:45:00Z",
  "client_number": "CLIENT-2024-0156"
}`
        }
      ]
    },
    analytics: {
      title: 'Analytics & Insights API',
      description: 'Business intelligence and reporting data',
      icon: Zap,
      methods: [
        {
          method: 'GET',
          path: '/api-invoices/analytics/overview',
          description: 'Get comprehensive business overview',
          params: ['period', 'currency', 'client_id'],
          response: `{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "type": "month"
  },
  "revenue": {
    "total": 285000.00,
    "paid": 247500.00,
    "pending": 37500.00,
    "overdue": 12000.00,
    "growth_rate": 15.7
  },
  "invoices": {
    "total_count": 124,
    "sent": 98,
    "paid": 89,
    "pending": 23,
    "overdue": 12,
    "average_amount": 2298.39,
    "conversion_rate": 90.8
  },
  "clients": {
    "total_active": 45,
    "new_this_period": 8,
    "top_clients": [
      {
        "id": "client_1",
        "name": "Enterprise Corp",
        "total_revenue": 45000.00,
        "invoice_count": 12
      }
    ]
  },
  "trends": {
    "monthly_revenue": [
      {"month": "2023-12", "amount": 247500.00},
      {"month": "2024-01", "amount": 285000.00}
    ],
    "payment_methods": {
      "bank_transfer": 67.2,
      "credit_card": 28.5,
      "check": 4.3
    }
  }
}`
        },
        {
          method: 'GET',
          path: '/api-invoices/analytics/reports',
          description: 'Generate detailed financial reports',
          params: ['report_type', 'format', 'date_from', 'date_to'],
          response: `{
  "report_id": "report_550e8400",
  "type": "revenue_summary",
  "format": "json",
  "generated_at": "2024-01-01T18:30:00Z",
  "download_url": "https://api.example.com/reports/download/report_550e8400",
  "expires_at": "2024-01-08T18:30:00Z",
  "data": {
    "summary": {
      "total_revenue": 285000.00,
      "total_invoices": 124,
      "average_invoice": 2298.39
    }
  }
}`
        }
      ]
    },
    templates: {
      title: 'Templates API',
      description: 'Invoice template management and customization',
      icon: Book,
      methods: [
        {
          method: 'GET',
          path: '/api-invoices/templates',
          description: 'Get available invoice templates',
          response: `{
  "data": [
    {
      "id": "template_modern",
      "name": "Modern Professional",
      "description": "Clean, modern design for professional services",
      "preview_url": "https://templates.example.com/modern/preview",
      "is_premium": false,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "template_corporate",
      "name": "Corporate Elite",
      "description": "Premium template for enterprise clients",
      "preview_url": "https://templates.example.com/corporate/preview",
      "is_premium": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}`
        }
      ]
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, SOC 2 compliant, role-based access control'
    },
    {
      icon: Zap,
      title: 'High Performance',
      description: '99.9% uptime SLA, global CDN, sub-200ms response times'
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'RESTful APIs, comprehensive SDKs, extensive documentation'
    },
    {
      icon: Globe,
      title: 'Global Scale',
      description: 'Multi-currency, multi-language, compliance ready'
    }
  ];

  const quickStartSteps = [
    {
      title: 'Generate API Key',
      description: 'Create your secure API key in the dashboard',
      action: 'Generate Key'
    },
    {
      title: 'Install SDK',
      description: 'Download and integrate our JavaScript SDK',
      action: 'Download SDK'
    },
    {
      title: 'Make First Call',
      description: 'Test your integration with a sample request',
      action: 'Try API'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary-600 to-primary-700">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-6 py-16">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Terminal className="h-8 w-8 text-white" />
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Developer Portal
              </Badge>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Enterprise Invoice API
              <span className="block text-3xl font-normal text-blue-100 mt-2">
                Built for scale, designed for developers
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl leading-relaxed">
              Integrate powerful invoice management into your applications with our comprehensive REST API. 
              Handle everything from creation to payments with enterprise-grade reliability.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 font-semibold px-8">
                <Code className="h-5 w-5 mr-2" />
                Start Building
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8">
                <Download className="h-5 w-5 mr-2" />
                Download SDK
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 font-semibold">
                View Examples <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0 h-8 bg-gradient-to-r from-slate-50 via-white to-blue-50 transform skew-y-1"></div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="quick-start" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 h-14 bg-gray-100/80 backdrop-blur-sm">
            <TabsTrigger value="quick-start" className="font-semibold">Quick Start</TabsTrigger>
            <TabsTrigger value="authentication" className="font-semibold">Authentication</TabsTrigger>
            <TabsTrigger value="endpoints" className="font-semibold">API Reference</TabsTrigger>
            <TabsTrigger value="webhooks" className="font-semibold">Webhooks</TabsTrigger>
            <TabsTrigger value="sdks" className="font-semibold">SDKs & Tools</TabsTrigger>
            <TabsTrigger value="api-keys" className="font-semibold">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="quick-start" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <Zap className="h-6 w-6 text-primary" />
                      Get Started in Minutes
                    </CardTitle>
                    <CardDescription className="text-base">
                      Follow these simple steps to integrate our invoice API
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {quickStartSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-xl">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{step.title}</h4>
                          <p className="text-muted-foreground text-sm mb-3">{step.description}</p>
                          <Button variant="outline" size="sm" className="font-medium">
                            {step.action}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Base URL & Environment</CardTitle>
                    <CardDescription>Production-ready endpoint for all API requests</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-900 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 font-medium">Production</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard('https://dsvtpfgkguhpkxcdquce.supabase.co/functions/v1/api-invoices')}
                          className="text-gray-400 hover:text-white"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <code className="text-white text-sm font-mono">
                        https://dsvtpfgkguhpkxcdquce.supabase.co/functions/v1/api-invoices
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      SDK Downloads
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={downloadSDK} 
                      className="w-full justify-start font-medium" 
                      size="lg"
                    >
                      <FileCode className="h-5 w-5 mr-3" />
                      JavaScript SDK
                      <Badge variant="secondary" className="ml-auto">v2.1.0</Badge>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                      <Github className="h-5 w-5 mr-3" />
                      Python SDK
                      <Badge variant="secondary" className="ml-auto">Soon</Badge>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                      <Code className="h-5 w-5 mr-3" />
                      PHP SDK
                      <Badge variant="secondary" className="ml-auto">Soon</Badge>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Book className="h-4 w-4 mr-2" />
                      Documentation
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Support Center
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    API Key Authentication
                  </CardTitle>
                  <CardDescription>
                    Secure server-to-server authentication for production applications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Request Headers</h4>
                    <div className="p-4 bg-gray-900 rounded-xl">
                      <pre className="text-green-400 text-sm font-mono">
{`x-api-key: invx_live_abc123...
Content-Type: application/json`}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Example Request</h4>
                    <div className="p-4 bg-gray-900 rounded-xl">
                      <pre className="text-white text-sm font-mono">
{`curl -X GET \\
  -H "x-api-key: invx_live_abc123..." \\
  -H "Content-Type: application/json" \\
  https://api.example.com/invoices`}
                      </pre>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-amber-800">Security Best Practices</h5>
                        <ul className="text-sm text-amber-700 mt-1 space-y-1">
                          <li>• Store API keys securely in environment variables</li>
                          <li>• Use different keys for development and production</li>
                          <li>• Rotate keys regularly for enhanced security</li>
                          <li>• Never expose keys in client-side code</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    JWT Authentication
                  </CardTitle>
                  <CardDescription>
                    Token-based authentication for web applications and user sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Authorization Header</h4>
                    <div className="p-4 bg-gray-900 rounded-xl">
                      <pre className="text-blue-400 text-sm font-mono">
{`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Token Scopes</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">invoices:read</Badge>
                        <span className="text-sm text-muted-foreground">Read invoice data</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">invoices:write</Badge>
                        <span className="text-sm text-muted-foreground">Create and update invoices</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">clients:manage</Badge>
                        <span className="text-sm text-muted-foreground">Full client management</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Token Features</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Automatic expiration and refresh</li>
                      <li>• Granular permission scopes</li>
                      <li>• User context and audit trails</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg mb-4">API Categories</h3>
                {Object.entries(endpoints).map(([key, endpoint]) => {
                  const Icon = endpoint.icon;
                  return (
                    <Button
                      key={key}
                      variant={selectedEndpoint === key ? 'default' : 'ghost'}
                      className="w-full justify-start h-auto p-4"
                      onClick={() => setSelectedEndpoint(key)}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{endpoint.title}</div>
                        <div className="text-xs opacity-70">{endpoint.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>

              <div className="lg:col-span-3">
                {selectedEndpoint && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        {React.createElement(endpoints[selectedEndpoint].icon, { className: "h-6 w-6 text-primary" })}
                        <CardTitle className="text-2xl">{endpoints[selectedEndpoint].title}</CardTitle>
                      </div>
                      <CardDescription className="text-base">
                        {endpoints[selectedEndpoint].description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {endpoints[selectedEndpoint].methods.map((method, index) => (
                        <div key={index} className="border-l-4 border-primary pl-6 space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <Badge 
                              variant={method.method === 'GET' ? 'default' : 
                                     method.method === 'POST' ? 'secondary' : 'outline'}
                              className="text-sm px-3 py-1"
                            >
                              {method.method}
                            </Badge>
                            <code className="text-sm bg-gray-100 px-3 py-2 rounded-lg font-mono">
                              {method.path}
                            </code>
                          </div>
                          
                          <p className="text-muted-foreground leading-relaxed">{method.description}</p>
                          
                          {method.params && (
                            <div>
                              <h5 className="font-semibold mb-2">Query Parameters</h5>
                              <div className="flex flex-wrap gap-2">
                                {method.params.map(param => (
                                  <Badge key={param} variant="outline" className="text-xs font-mono">
                                    {param}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {method.body && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold">Request Body</h5>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(method.body)}
                                  className="h-8"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="bg-gray-900 p-4 rounded-xl overflow-x-auto">
                                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                                  {method.body}
                                </pre>
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold">Response</h5>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(method.response)}
                                className="h-8"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="bg-gray-900 p-4 rounded-xl overflow-x-auto">
                              <pre className="text-blue-400 text-sm font-mono whitespace-pre-wrap">
                                {method.response}
                              </pre>
                            </div>
                          </div>

                          {index < endpoints[selectedEndpoint].methods.length - 1 && (
                            <Separator className="my-8" />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5 text-primary" />
                    Webhook Events
                  </CardTitle>
                  <CardDescription>
                    Real-time notifications for critical business events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Available Events</h4>
                    <div className="space-y-3">
                      {[
                        { event: 'invoice.created', description: 'New invoice created', color: 'bg-blue-50 border-blue-200' },
                        { event: 'invoice.sent', description: 'Invoice sent to client', color: 'bg-green-50 border-green-200' },
                        { event: 'invoice.paid', description: 'Payment received', color: 'bg-emerald-50 border-emerald-200' },
                        { event: 'invoice.overdue', description: 'Payment overdue', color: 'bg-red-50 border-red-200' },
                        { event: 'client.created', description: 'New client added', color: 'bg-purple-50 border-purple-200' },
                        { event: 'payment.failed', description: 'Payment attempt failed', color: 'bg-orange-50 border-orange-200' },
                      ].map(({ event, description, color }) => (
                        <div key={event} className={`p-4 border rounded-xl ${color}`}>
                          <div className="flex items-center justify-between">
                            <code className="font-mono text-sm font-semibold">{event}</code>
                            <Badge variant="outline" className="text-xs">Active</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Webhook Configuration</CardTitle>
                    <CardDescription>Set up webhook endpoints for your application</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Endpoint URL</h4>
                      <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm">
                        https://your-app.com/webhooks/invoice
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Required Headers</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <code>Content-Type</code>
                          <span className="text-muted-foreground">application/json</span>
                        </div>
                        <div className="flex justify-between">
                          <code>X-Webhook-Signature</code>
                          <span className="text-muted-foreground">HMAC-SHA256</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Webhooks
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Payload Example</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 p-4 rounded-xl">
                      <pre className="text-green-400 text-sm font-mono overflow-x-auto">
{`{
  "event": "invoice.paid",
  "data": {
    "id": "inv_abc123",
    "invoice_number": "INV-0001",
    "amount_paid": 2500.00,
    "payment_method": "bank_transfer",
    "client": {
      "name": "Enterprise Corp",
      "email": "billing@enterprise.com"
    }
  },
  "timestamp": "2024-01-01T15:30:00Z",
  "api_version": "v1"
}`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sdks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-primary" />
                    JavaScript SDK
                  </CardTitle>
                  <CardDescription>
                    Full-featured SDK for Node.js and browser environments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Installation & Setup</h4>
                      <Button 
                        onClick={downloadSDK}
                        size="sm"
                        className="font-medium"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl">
                      <pre className="text-green-400 text-sm font-mono">
{`// Browser (CDN)
<script src="/invoice-sdk.js"></script>

// Node.js (CommonJS)
const { InvoiceSDK } = require('./invoice-sdk');

// ES Modules
import { InvoiceSDK } from './invoice-sdk.js';`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Quick Example</h4>
                    <div className="bg-gray-900 p-4 rounded-xl">
                      <pre className="text-blue-400 text-sm font-mono">
{`// Initialize SDK
const sdk = new InvoiceSDK({
  baseUrl: 'https://api.example.com',
  apiKey: 'invx_live_abc123...'
});

// Create invoice
const invoice = await sdk.createInvoice({
  client_id: 'client_uuid',
  items: [{
    name: 'Consulting',
    rate: 150,
    quantity: 10
  }]
});

console.log('Invoice created:', invoice.id);`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Available Methods</h4>
                    <div className="space-y-2">
                      {[
                        'createInvoice(data)',
                        'getInvoices(params)',
                        'updateInvoice(id, data)',
                        'sendInvoice(id)',
                        'createClient(data)',
                        'getAnalytics(params)',
                        'createWebhook(config)'
                      ].map((method) => (
                        <div key={method} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <code className="text-sm font-mono">{method}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Embeddable Components</CardTitle>
                  <CardDescription>
                    Drop-in UI components for rapid integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Invoice Widget</h4>
                    <div className="bg-gray-900 p-4 rounded-xl">
                      <pre className="text-purple-400 text-sm font-mono">
{`// Create embeddable widget
const widget = new InvoiceWidget({
  containerId: 'invoice-form',
  apiKey: 'your_api_key',
  theme: {
    primaryColor: '#3b82f6',
    borderRadius: '8px'
  },
  onInvoiceCreated: (invoice) => {
    console.log('Success!', invoice);
  }
});

// Render invoice creation form
widget.renderCreateForm();`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Widget Features</h4>
                    <div className="space-y-2">
                      {[
                        'Customizable themes and styling',
                        'Real-time validation and feedback',
                        'Mobile-responsive design',
                        'Multi-currency support',
                        'Tax calculation integration',
                        'Client auto-complete'
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h5 className="font-semibold text-blue-800 mb-2">Live Demo</h5>
                    <p className="text-sm text-blue-700 mb-3">
                      See the widget in action with our interactive demo
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Demo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Code Examples & Tutorials</CardTitle>
                <CardDescription>
                  Comprehensive guides and sample implementations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'React Integration', description: 'Complete React app with invoice management', tech: 'React + TypeScript' },
                    { title: 'Node.js Backend', description: 'Server-side invoice processing', tech: 'Node.js + Express' },
                    { title: 'Webhook Handler', description: 'Real-time event processing', tech: 'JavaScript' }
                  ].map((example) => (
                    <div key={example.title} className="p-4 border border-gray-200 rounded-xl hover:border-primary/30 transition-colors">
                      <h4 className="font-semibold mb-2">{example.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{example.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{example.tech}</Badge>
                        <Button variant="ghost" size="sm">
                          <Github className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-6 w-6 text-primary" />
                  API Key Management
                </CardTitle>
                <CardDescription className="text-base">
                  Generate and manage your API keys for secure access to the Invoice API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeyManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}