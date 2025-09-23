import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Check, Eye, ArrowLeft } from 'lucide-react';
import { templateConfigs, TemplateConfig } from '@/templates/invoiceTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const TemplateSelectionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const subscription = useSubscription();
  const { settings, updateSetting, saveSettings } = useSettings();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<number>(1);

  // Load current template from settings
  useEffect(() => {
    if (settings.selectedTemplate) {
      setCurrentTemplate(settings.selectedTemplate);
    }
  }, [settings]);

  const basicTemplates = Object.values(templateConfigs).filter(t => t.category === 'basic');
  const premiumTemplates = Object.values(templateConfigs).filter(t => t.category === 'premium');

  const isPremiumUser = subscription?.subscribed || false;

  const handleTemplateSelect = async (template: TemplateConfig) => {
    if (template.category === 'premium' && !isPremiumUser) {
      toast.error('Premium templates require a paid subscription');
      return;
    }

    setCurrentTemplate(template.id);
    updateSetting('selectedTemplate', template.id);
    await saveSettings({ selectedTemplate: template.id } as any);
    toast.success(`Template "${template.name}" selected successfully!`);
  };

  const handlePreview = (template: TemplateConfig) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const renderTemplatePreview = (template: TemplateConfig) => {
    const style = {
      background: template.gradient || template.colors.background || '#ffffff',
      color: template.colors.primary,
      minHeight: '200px'
    };

    const isPremium = template.category === 'premium';
    const layoutStyle = isPremium ? template.layout : 'standard';

    return (
      <div className="w-full h-48 p-4 border rounded-lg overflow-hidden relative" style={style}>
        {/* Layout-specific previews for premium templates */}
        {isPremium && layoutStyle === 'executive' && (
          <>
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r" style={{ 
              background: `linear-gradient(135deg, ${template.colors.accent}, ${template.colors.primary})` 
            }}></div>
            <div className="mt-10 space-y-2">
              <div className="w-full h-6 rounded shadow-lg" style={{ backgroundColor: template.colors.primary }}></div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="h-12 rounded border" style={{ backgroundColor: template.colors.background }}></div>
                <div className="h-12 rounded border" style={{ backgroundColor: template.colors.background }}></div>
                <div className="h-12 rounded border" style={{ backgroundColor: template.colors.background }}></div>
              </div>
            </div>
          </>
        )}
        
        {isPremium && layoutStyle === 'sidebar' && (
          <div className="flex h-full">
            <div className="w-16 h-full rounded-l" style={{ 
              background: `linear-gradient(180deg, ${template.colors.primary}, ${template.colors.accent})` 
            }}></div>
            <div className="flex-1 p-2 space-y-2">
              <div className="w-full h-4 rounded" style={{ backgroundColor: template.colors.primary }}></div>
              <div className="space-y-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full h-2 rounded" style={{ backgroundColor: template.colors.secondary }}></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isPremium && layoutStyle === 'split' && (
          <div className="grid grid-cols-2 h-full gap-1">
            <div className="rounded" style={{ 
              background: `linear-gradient(45deg, ${template.colors.primary}, ${template.colors.accent})` 
            }}></div>
            <div className="bg-white p-2 space-y-2 rounded">
              <div className="w-full h-3 rounded" style={{ backgroundColor: template.colors.primary }}></div>
              <div className="space-y-1">
                {[1, 2].map(i => (
                  <div key={i} className="w-full h-2 rounded" style={{ backgroundColor: template.colors.secondary }}></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isPremium && layoutStyle === 'modern' && (
          <>
            <div className="w-full h-6 mb-4 rounded-t bg-white/90 backdrop-blur flex items-center px-2" style={{ 
              borderBottom: `3px solid ${template.colors.accent}` 
            }}>
              <div className="w-12 h-3 rounded" style={{ backgroundColor: template.colors.primary }}></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 rounded border-2" style={{ 
                  backgroundColor: template.colors.background,
                  borderColor: template.colors.accent + '40'
                }}></div>
              ))}
            </div>
            <div className="w-full h-8 rounded" style={{ 
              background: `linear-gradient(135deg, ${template.colors.accent}, ${template.colors.primary})` 
            }}></div>
          </>
        )}

        {/* Standard preview for basic templates */}
        {!isPremium && (
          <>
            <div className="flex justify-between items-start mb-4">
              <div className="w-16 h-8 rounded" style={{ backgroundColor: template.colors.accent }}></div>
              <div className="text-right">
                <div className="w-20 h-4 mb-1 rounded" style={{ backgroundColor: template.colors.secondary }}></div>
                <div className="w-16 h-3 rounded" style={{ backgroundColor: template.colors.secondary }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="w-32 h-4 rounded" style={{ backgroundColor: template.colors.primary }}></div>
              <div className="w-24 h-3 rounded" style={{ backgroundColor: template.colors.secondary }}></div>
            </div>

            <div className="mt-4 space-y-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between">
                  <div className="w-20 h-2 rounded" style={{ backgroundColor: template.colors.secondary }}></div>
                  <div className="w-12 h-2 rounded" style={{ backgroundColor: template.colors.accent }}></div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-16 h-6 rounded" style={{ backgroundColor: template.colors.accent }}></div>
            </div>
          </>
        )}

        {/* Category indicator */}
        <div className="absolute top-2 right-2">
          <div className={`text-xs px-2 py-1 rounded ${isPremium ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-700'}`}>
            {isPremium ? layoutStyle?.toUpperCase() : 'BASIC'}
          </div>
        </div>
      </div>
    );
  };

  const renderFullPreview = (template: TemplateConfig) => {
    const style = {
      background: template.gradient || template.colors.background || '#ffffff',
      color: template.colors.primary,
      minHeight: '600px'
    };

    return (
      <div className="w-full p-8 border rounded-lg" style={style}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="w-32 h-16 rounded mb-4" style={{ backgroundColor: template.colors.accent }}></div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: template.colors.primary }}>
                INVOICE
              </h1>
              <p style={{ color: template.colors.secondary }}>Invoice #INV-2024-001</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold mb-2" style={{ color: template.colors.primary }}>
                Your Company Name
              </h2>
              <div style={{ color: template.colors.secondary }}>
                <p>123 Business Street</p>
                <p>City, State 12345</p>
                <p>contact@company.com</p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2" style={{ color: template.colors.primary }}>Bill To:</h3>
              <div style={{ color: template.colors.secondary }}>
                <p>Client Company</p>
                <p>456 Client Avenue</p>
                <p>Client City, State 67890</p>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold" style={{ color: template.colors.primary }}>Date:</p>
                  <p style={{ color: template.colors.secondary }}>January 15, 2024</p>
                </div>
                <div>
                  <p className="font-semibold" style={{ color: template.colors.primary }}>Due Date:</p>
                  <p style={{ color: template.colors.secondary }}>February 14, 2024</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2" style={{ borderColor: template.colors.accent }}>
                  <th className="text-left py-2" style={{ color: template.colors.primary }}>Description</th>
                  <th className="text-right py-2" style={{ color: template.colors.primary }}>Qty</th>
                  <th className="text-right py-2" style={{ color: template.colors.primary }}>Rate</th>
                  <th className="text-right py-2" style={{ color: template.colors.primary }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b" style={{ borderColor: template.colors.secondary }}>
                  <td className="py-2" style={{ color: template.colors.secondary }}>Web Development Services</td>
                  <td className="text-right py-2" style={{ color: template.colors.secondary }}>40</td>
                  <td className="text-right py-2" style={{ color: template.colors.secondary }}>$100.00</td>
                  <td className="text-right py-2" style={{ color: template.colors.primary }}>$4,000.00</td>
                </tr>
                <tr className="border-b" style={{ borderColor: template.colors.secondary }}>
                  <td className="py-2" style={{ color: template.colors.secondary }}>Design Consultation</td>
                  <td className="text-right py-2" style={{ color: template.colors.secondary }}>10</td>
                  <td className="text-right py-2" style={{ color: template.colors.secondary }}>$150.00</td>
                  <td className="text-right py-2" style={{ color: template.colors.primary }}>$1,500.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-1">
                <span style={{ color: template.colors.secondary }}>Subtotal:</span>
                <span style={{ color: template.colors.primary }}>$5,500.00</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: template.colors.secondary }}>Tax (10%):</span>
                <span style={{ color: template.colors.primary }}>$550.00</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 font-bold" style={{ borderColor: template.colors.accent }}>
                <span style={{ color: template.colors.primary }}>Total:</span>
                <span style={{ color: template.colors.accent }}>$6,050.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Invoice Templates</h1>
            <p className="text-muted-foreground">Choose a template for your invoice exports</p>
          </div>
        </div>

        {/* Current Template */}
        {currentTemplate && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Current Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-32">
                  {renderTemplatePreview(templateConfigs[currentTemplate])}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{templateConfigs[currentTemplate].name}</h3>
                  <p className="text-muted-foreground">{templateConfigs[currentTemplate].description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={templateConfigs[currentTemplate].category === 'premium' ? 'default' : 'secondary'}>
                      {templateConfigs[currentTemplate].category === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                      {templateConfigs[currentTemplate].category}
                    </Badge>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Templates */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Basic Templates</h2>
          <p className="text-muted-foreground mb-6">Free templates available to all users</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {basicTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="secondary">Basic</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent>
                  {renderTemplatePreview(template)}
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {template.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(template)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant={currentTemplate === template.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTemplateSelect(template)}
                        className="flex-1"
                      >
                        {currentTemplate === template.id ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Selected
                          </>
                        ) : (
                          'Select'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Premium Templates */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Crown className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Premium Templates</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Exclusive templates for premium subscribers with advanced styling and features
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow relative">
                {!isPremiumUser && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <div className="text-center">
                      <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold">Premium Required</p>
                    </div>
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className="bg-primary">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent>
                  {renderTemplatePreview(template)}
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {template.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(template)}
                        className="flex-1"
                        disabled={!isPremiumUser}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant={currentTemplate === template.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTemplateSelect(template)}
                        className="flex-1"
                        disabled={!isPremiumUser}
                      >
                        {currentTemplate === template.id ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Selected
                          </>
                        ) : (
                          'Select'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upgrade CTA for Basic Users */}
        {!isPremiumUser && (
          <Card className="mt-8 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-6">
              <div className="text-center">
                <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Unlock Premium Templates</h3>
                <p className="text-muted-foreground mb-4">
                  Get access to exclusive premium templates with advanced styling, gradients, and professional designs
                </p>
                <Button onClick={() => navigate('/subscription')} className="bg-primary hover:bg-primary/90">
                  Upgrade to Premium
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate?.name} Preview
                <Badge className="ml-2" variant={selectedTemplate?.category === 'premium' ? 'default' : 'secondary'}>
                  {selectedTemplate?.category === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                  {selectedTemplate?.category}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {selectedTemplate && renderFullPreview(selectedTemplate)}
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                {selectedTemplate && (
                  <Button onClick={() => {
                    handleTemplateSelect(selectedTemplate);
                    setShowPreview(false);
                  }}>
                    {currentTemplate === selectedTemplate.id ? 'Selected' : 'Select This Template'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TemplateSelectionPage;