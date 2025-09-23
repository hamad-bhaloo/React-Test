
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Mail, Palette, Layout } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const InvoiceTemplatesPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const templates = [
    {
      id: 1,
      name: 'Classic Professional',
      description: 'Traditional layout with header logo and clean lines',
      category: 'Professional',
      colors: ['#2563eb', '#ffffff', '#64748b'],
      features: ['Header with logo', 'Traditional table layout', 'Clean typography', 'Professional footer'],
      design: 'classic'
    },
    {
      id: 2,
      name: 'Modern Sidebar',
      description: 'Side-by-side layout with color accent sidebar',
      category: 'Modern',
      colors: ['#059669', '#f8fafc', '#374151'],
      features: ['Sidebar design', 'Asymmetric layout', 'Color blocks', 'Modern spacing'],
      design: 'sidebar'
    },
    {
      id: 3,
      name: 'Creative Geometric',
      description: 'Bold geometric shapes with vibrant accents',
      category: 'Creative',
      colors: ['#dc2626', '#fef2f2', '#1f2937'],
      features: ['Geometric elements', 'Bold headers', 'Creative layout', 'Artistic touches'],
      design: 'geometric'
    },
    {
      id: 4,
      name: 'Minimal Grid',
      description: 'Clean grid-based layout with lots of white space',
      category: 'Minimal',
      colors: ['#1e40af', '#ffffff', '#9ca3af'],
      features: ['Grid system', 'White space focus', 'Minimal elements', 'Typography emphasis'],
      design: 'grid'
    },
    {
      id: 5,
      name: 'Tech Card',
      description: 'Card-based design with tech-inspired elements',
      category: 'Tech',
      colors: ['#7c3aed', '#f3f4f6', '#4b5563'],
      features: ['Card layout', 'Tech styling', 'Modern borders', 'Innovative structure'],
      design: 'cards'
    },
    {
      id: 6,
      name: 'Elegant Timeline',
      description: 'Timeline-style layout with elegant typography',
      category: 'Luxury',
      colors: ['#d97706', '#fffbeb', '#78716c'],
      features: ['Timeline layout', 'Elegant fonts', 'Luxury styling', 'Premium elements'],
      design: 'timeline'
    }
  ];

  const categories = ['All', 'Professional', 'Modern', 'Creative', 'Minimal', 'Tech', 'Luxury'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const handlePreview = (template: any) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleUseTemplate = (templateId: number) => {
    localStorage.setItem('selectedInvoiceTemplate', templateId.toString());
    toast.success('Template selected! It will be used for new invoices.');
  };

  const renderTemplatePreview = (template: any) => {
    const primaryColor = template.colors[0];
    
    switch (template.design) {
      case 'classic':
        return (
          <div className="aspect-[3/4] bg-white rounded-lg p-3 border shadow-sm">
            <div className="border-b-2 pb-2 mb-3" style={{ borderColor: primaryColor }}>
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded" style={{ backgroundColor: primaryColor }}></div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: primaryColor }}>INVOICE</div>
                  <div className="text-xs">#001</div>
                </div>
              </div>
            </div>
            <div className="text-xs border mb-2">
              <div className="bg-gray-100 p-1 font-semibold grid grid-cols-4 gap-1">
                <div>Item</div><div>Qty</div><div>Rate</div><div>Total</div>
              </div>
              <div className="p-1 border-b grid grid-cols-4 gap-1">
                <div>Service</div><div>1</div><div>$100</div><div>$100</div>
              </div>
            </div>
            <div className="text-right text-xs font-bold" style={{ color: primaryColor }}>Total: $100.00</div>
          </div>
        );

      case 'sidebar':
        return (
          <div className="aspect-[3/4] bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="flex h-full">
              <div className="w-1/3 p-2 text-white text-xs" style={{ backgroundColor: primaryColor }}>
                <div className="font-bold mb-2">INVOICE</div>
                <div className="space-y-1">
                  <div>Date: 12/27</div>
                  <div>Due: 01/26</div>
                  <div className="mt-3 font-bold">Total</div>
                  <div className="text-lg">$270</div>
                </div>
              </div>
              <div className="flex-1 p-2">
                <div className="text-xs space-y-2">
                  <div className="font-semibold">Bill To:</div>
                  <div>Client Name</div>
                  <div className="mt-3">
                    <div className="grid grid-cols-3 gap-1 text-xs border-b pb-1 font-semibold">
                      <div>Item</div><div>Qty</div><div>Amount</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs py-1">
                      <div>Service</div><div>2</div><div>$270</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="aspect-[3/4] bg-white rounded-lg p-3 border shadow-sm">
            <div className="text-center mt-8">
              <div className="text-lg font-bold" style={{ color: primaryColor }}>INVOICE</div>
              <div className="text-xs mt-2">Template Preview</div>
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                <div className="h-2 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderFullPreview = (template: any) => {
    const primaryColor = template.colors[0];
    const secondaryColor = template.colors[1];
    
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-4xl mx-auto">
        <div className="border-b-4 pb-6 mb-8" style={{ borderColor: primaryColor }}>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: primaryColor }}>
                LOGO
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>Your Company</h1>
                <p className="text-gray-600">123 Business Street, City, State</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>INVOICE</h2>
              <div className="text-gray-600">
                <p>Invoice #: INV-2024-001</p>
                <p>Date: December 27, 2024</p>
                <p>Due Date: January 26, 2025</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-3" style={{ color: primaryColor }}>Bill To:</h3>
            <div className="text-gray-700">
              <p className="font-semibold text-lg">Client Company</p>
              <p>456 Client Avenue</p>
              <p>Business City, State 54321</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border" style={{ borderColor: primaryColor }}>
            <thead>
              <tr style={{ backgroundColor: primaryColor, color: 'white' }}>
                <th className="text-left p-3 border" style={{ borderColor: primaryColor }}>Description</th>
                <th className="text-center p-3 border" style={{ borderColor: primaryColor }}>Qty</th>
                <th className="text-right p-3 border" style={{ borderColor: primaryColor }}>Rate</th>
                <th className="text-right p-3 border" style={{ borderColor: primaryColor }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border border-gray-300">Web Development Services</td>
                <td className="text-center p-3 border border-gray-300">40 hrs</td>
                <td className="text-right p-3 border border-gray-300">$75.00</td>
                <td className="text-right p-3 border border-gray-300">$3,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300">UI/UX Design</td>
                <td className="text-center p-3 border border-gray-300">20 hrs</td>
                <td className="text-right p-3 border border-gray-300">$85.00</td>
                <td className="text-right p-3 border border-gray-300">$1,700.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="flex justify-between py-2 border-b">
              <span>Subtotal:</span>
              <span>$4,700.00</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Tax (10%):</span>
              <span>$470.00</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold text-lg" style={{ color: primaryColor }}>
              <span>TOTAL:</span>
              <span>$5,170.00</span>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg text-center text-gray-600" style={{ backgroundColor: secondaryColor }}>
          <p className="font-semibold" style={{ color: primaryColor }}>This is how {template.name} template will look when downloaded</p>
          <p className="text-sm mt-2">All invoice data will be properly formatted according to this template design</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Templates</h1>
          <p className="text-gray-600 mt-1">Choose from our collection of professional invoice templates</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Palette size={20} className="mr-2" />
          Custom Template
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">{template.category}</Badge>
                </div>
                <div className="flex space-x-1">
                  {template.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Preview */}
              {renderTemplatePreview(template)}

              <p className="text-sm text-gray-600">{template.description}</p>

              {/* Features */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Features:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {template.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-1 h-1 bg-orange-500 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(template)}
                  className="flex-1"
                >
                  <Eye size={16} className="mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(template.id)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout size={20} />
              Template Preview - {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Template Info */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">{selectedTemplate?.name}</h3>
                <p className="text-gray-600">{selectedTemplate?.description}</p>
                <Badge variant="secondary" className="mt-2">{selectedTemplate?.category}</Badge>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download size={16} className="mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Mail size={16} className="mr-1" />
                  Email Test
                </Button>
                <Button 
                  size="sm" 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    handleUseTemplate(selectedTemplate?.id);
                    setShowPreview(false);
                  }}
                >
                  Use Template
                </Button>
              </div>
            </div>

            {/* Full Template Preview */}
            {selectedTemplate && renderFullPreview(selectedTemplate)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceTemplatesPage;
