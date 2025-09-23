import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, Wand2, Target, ArrowLeft, Users, AlertTriangle, Search, Zap, Building2, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { downloadInvoicePDF } from '@/utils/invoiceDownload';
import EnhancedAIInvoiceGenerator from '@/components/automation/EnhancedAIInvoiceGenerator';
import InvoicePreviewCard from '@/components/automation/InvoicePreviewCard';
import InvoiceViewForm from '@/components/invoices/InvoiceViewForm';
import { LegoLoading } from '@/components/ui/lego-loading';

const AutomationPage = () => {
  const navigate = useNavigate();
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  
  const createInvoice = useCreateInvoice();
  const { data: clients = [] } = useClients();
  const { user } = useAuth();

  // Handle Enter key to generate invoice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !generatedInvoice) {
        // Only trigger if not in generated state and not Shift+Enter (for line breaks)
        if (selectedClientId && searchQuery.trim() && !isGenerating) {
          e.preventDefault();
          generateInvoice(searchQuery);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedClientId, searchQuery, isGenerating, generatedInvoice]);

  // Animation step progression
  useEffect(() => {
    if (isGenerating) {
      setCurrentStep(0);
      const interval = setInterval(() => {
        setCurrentStep(prev => prev < 3 ? prev + 1 : 3);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const { data: company } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching company:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });

  const quickPrompts = [
    {
      icon: Wand2,
      title: "Web Development",
      prompt: "Create invoice for web development, 40 hours at $95/hour for TechCorp Inc",
    },
    {
      icon: Target,
      title: "Consulting Services",
      prompt: "Invoice for consulting services, $3000, with 12% tax",
    }
  ];

  const handleQuickPrompt = (prompt: string) => {
    setSearchQuery(prompt);
    generateInvoice(prompt);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('Please select a client before generating an invoice');
      return;
    }
    if (searchQuery.trim()) {
      generateInvoice(searchQuery);
    }
  };

  const generateInvoice = async (prompt: string) => {
    if (!selectedClientId) {
      toast.error('Please select a client before generating an invoice');
      return;
    }
    
    setIsGenerating(true);
    setCurrentStep(0);
    
    try {
      console.log('Calling AI invoice generator with prompt:', prompt);
      
      // Step 1: Extracting client details
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentStep(1);
      
      // Include selected client information in the prompt
      let enhancedPrompt = prompt;
      const clientForPrompt = clients.find(c => c.id === selectedClientId);
      if (clientForPrompt) {
        enhancedPrompt = `${prompt}. Client details: ${clientForPrompt.name || `${clientForPrompt.first_name} ${clientForPrompt.last_name}`}, Email: ${clientForPrompt.email}, Company: ${clientForPrompt.company || 'N/A'}`;
      }
      
      // Step 2: Identifying products and services
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(2);
      
      const { data, error } = await supabase.functions.invoke('ai-invoice-generator', {
        body: { prompt: enhancedPrompt }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate invoice');
      }

      if (!data) {
        throw new Error('No data received from AI generator');
      }

      // Step 3: Calculating amounts
      await new Promise(resolve => setTimeout(resolve, 600));
      setCurrentStep(3);

      console.log('Received invoice data:', data);
      
      // Override client information with selected client
      const selectedClient = clients.find(c => c.id === selectedClientId);
      if (selectedClient) {
        data.client = {
          name: selectedClient.name || `${selectedClient.first_name} ${selectedClient.last_name}`,
          email: selectedClient.email,
          address: selectedClient.address || 'Address not provided'
        };
      }
      
      // Step 4: Finalizing invoice structure
      await new Promise(resolve => setTimeout(resolve, 400));
      setCurrentStep(4);
      
      setGeneratedInvoice(data);
      setEditedInvoice({ ...data });
      toast.success('🎉 Invoice generated with AI magic!');
      
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast.error(`Failed to generate invoice: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setCurrentStep(0);
    }
  };

  const handleSaveInvoice = async () => {
    if (!editedInvoice || !user) {
      toast.error('No invoice to save or user not authenticated');
      return;
    }

    // Verify user is properly authenticated
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast.error('User authentication expired. Please log in again.');
      return;
    }

    setIsSaving(true);

    try {
      console.log('Starting invoice save process for user:', currentUser.id);
      // Use the selected client
      let clientId = selectedClientId;
      
      if (!clientId && editedInvoice.client) {
        // Try to find existing client by email
        const existingClient = clients.find(c => c.email === editedInvoice.client.email);
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              name: editedInvoice.client.name,
              email: editedInvoice.client.email,
              address: editedInvoice.client.address,
              user_id: user.id
            })
            .select()
            .single();
          
          if (clientError) {
            console.error('Error creating client:', clientError);
            throw new Error('Failed to create client');
          }
          
          clientId = newClient.id;
        }
      }

      // Validate and format dates
      const issueDateStr = new Date().toISOString().split('T')[0];
      let dueDateStr;
      
      if (!editedInvoice.dueDate || editedInvoice.dueDate === '') {
        // Default to 30 days from now if no due date provided
        dueDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else {
        const dueDate = new Date(editedInvoice.dueDate);
        if (isNaN(dueDate.getTime())) {
          throw new Error('Invalid due date provided');
        }
        dueDateStr = dueDate.toISOString().split('T')[0];
      }

      const invoiceData = {
        invoice_number: editedInvoice.invoiceNumber,
        client_id: clientId,
        issue_date: issueDateStr,
        due_date: dueDateStr,
        currency: editedInvoice.currency || 'USD',
        subtotal: editedInvoice.subtotal,
        tax_percentage: editedInvoice.taxPercentage || 0,
        tax_amount: editedInvoice.tax || 0,
        discount_percentage: editedInvoice.discountPercentage || 0,
        discount_amount: editedInvoice.discount || 0,
        shipping_charge: editedInvoice.shipping || 0,
        total_amount: editedInvoice.total,
        notes: editedInvoice.notes || '',
        status: 'draft',
        payment_status: 'unpaid',
        template_id: 1,
        invoice_items: editedInvoice.items.map((item: any) => ({
          product_name: item.description,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }))
      };

      const result = await createInvoice.mutateAsync(invoiceData);
      
      // Check if this might be the user's first invoice and send congratulations email
      try {
        await supabase.functions.invoke('send-first-invoice-congratulations', {
          body: {
            userId: user?.id,
            invoiceId: result.id,
            invoiceNumber: invoiceData.invoice_number
          }
        });
      } catch (emailError) {
        console.error('Error sending congratulations email:', emailError);
        // Don't fail invoice creation if email fails
      }
      
      // Trigger fullscreen confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success('✨ Invoice saved successfully!');
      navigate('/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!generatedInvoice) {
      toast.error('No invoice to download');
      return;
    }

    try {
      const invoiceForPDF = {
        invoice_number: generatedInvoice.invoiceNumber,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(generatedInvoice.dueDate).toISOString().split('T')[0],
        currency: generatedInvoice.currency || 'USD',
        subtotal: generatedInvoice.subtotal,
        tax_percentage: generatedInvoice.taxPercentage || 0,
        tax_amount: generatedInvoice.tax || 0,
        discount_percentage: generatedInvoice.discountPercentage || 0,
        discount_amount: generatedInvoice.discount || 0,
        shipping_charge: generatedInvoice.shipping || 0,
        total_amount: generatedInvoice.total,
        notes: generatedInvoice.notes,
        status: 'draft',
        template_id: 1
      };

      const clientForPDF = {
        name: generatedInvoice.client.name,
        email: generatedInvoice.client.email,
        address: generatedInvoice.client.address
      };

      const success = await downloadInvoicePDF(
        invoiceForPDF,
        clientForPDF,
        generatedInvoice.items,
        company,
        'Free'
      );

      if (success) {
        toast.success('📄 Invoice downloaded successfully!');
      } else {
        toast.error('Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.02)_25%,rgba(68,68,68,.02)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.02)_75%)] bg-[length:20px_20px]" />
      
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-border/30 py-4">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="hover:bg-muted"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-enterprise rounded-xl flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">AI Invoice Generator</h1>
                  <p className="text-sm text-muted-foreground">Create invoices with AI magic</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">AI Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* LEGO Loading Animation */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 border border-emerald-200/50 shadow-2xl max-w-2xl w-full mx-4 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">AI Invoice Generator</h3>
              <p className="text-sm text-muted-foreground">Building your invoice components...</p>
            </div>

            <LegoLoading 
              steps={[
                'Extracting client details from your description',
                'Identifying products, services, and pricing',
                'Calculating subtotals, taxes, and final amounts', 
                'Structuring invoice format and payment terms'
              ]}
              currentStep={currentStep}
              isActive={isGenerating}
              className="py-4"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-6 py-8">
        
        {!generatedInvoice ? (
          <div className="space-y-6">
            {/* Step 1: Simple Input Form */}
            
            {/* Step 1: Client Selection */}
            <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                  <h2 className="text-lg font-semibold text-foreground">Choose Your Client</h2>
                </div>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder="👤 Select a client from your list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-3 p-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {(client.name || `${client.first_name} ${client.last_name}` || 'C').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{client.name || `${client.first_name} ${client.last_name}`}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Step 2: Invoice Description */}
            <Card className={`border-2 ${selectedClientId ? 'border-dashed border-accent/20 bg-gradient-to-r from-accent/5 to-primary/5' : 'border-border/30 bg-muted/20 opacity-50'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${selectedClientId ? 'bg-accent' : 'bg-muted-foreground'}`}>2</div>
                  <h2 className="text-lg font-semibold text-foreground">Describe Your Invoice</h2>
                </div>
                
                <div className="space-y-4">
                  <textarea
                    placeholder="Tell me what to invoice for... 
                    
For example:
• Web development work - 40 hours at $95/hour
• Logo design project - $2,500 fixed price  
• Monthly consulting - $3,000 with 10% tax
• Video editing services - 20 hours at $60/hour, due in 30 days"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={!selectedClientId}
                    rows={6}
                    className="w-full p-4 text-base border-2 border-border/30 rounded-xl focus:border-primary focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  
                  {/* Quick Templates */}
                  {selectedClientId && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Quick Templates:</p>
                      <div className="flex flex-wrap gap-2">
                        {quickPrompts.map((template, i) => (
                          <button
                            key={i}
                            onClick={() => setSearchQuery(template.prompt)}
                            className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                          >
                            {template.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="text-center">
              <Button
                onClick={() => generateInvoice(searchQuery)}
                disabled={!selectedClientId || !searchQuery.trim() || isGenerating}
                size="lg"
                className="h-14 px-8 text-lg font-semibold btn-gradient-magical text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Magic...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    ✨ Generate My Invoice ✨
                    <Sparkles className="w-6 h-6" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Professional Invoice Results */
          <div className="space-y-8">
            
            {/* Professional Success Header */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl border border-gray-200 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Invoice Generated</h2>
                    <p className="text-gray-600">Invoice #{generatedInvoice.invoiceNumber} • {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{generatedInvoice.currency} {generatedInvoice.total.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                </div>
              </div>
            </div>

            {/* Enhanced Invoice Preview with Edit Capabilities */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">AI Generated Invoice</h3>
                      <p className="text-emerald-100">#{generatedInvoice.invoiceNumber} • Editable Preview</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{editedInvoice.currency} {Number(editedInvoice.total || 0).toFixed(2)}</div>
                    <div className="text-emerald-100 text-sm">Total Amount</div>
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-white space-y-8">
                {/* Client Information */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-border/50">
                  <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Client Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName" className="text-sm font-medium text-muted-foreground">Company Name</Label>
                      <Input
                        id="clientName"
                        value={editedInvoice.client?.name || ''}
                        onChange={(e) => setEditedInvoice(prev => ({
                          ...prev,
                          client: { ...prev.client, name: e.target.value }
                        }))}
                        className="mt-1 bg-background/80 border-border/60 focus:border-primary/60 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientEmail" className="text-sm font-medium text-muted-foreground">Email Address</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={editedInvoice.client?.email || ''}
                        onChange={(e) => setEditedInvoice(prev => ({
                          ...prev,
                          client: { ...prev.client, email: e.target.value }
                        }))}
                        className="mt-1 bg-background/80 border-border/60 focus:border-primary/60 focus:ring-primary/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="clientAddress" className="text-sm font-medium text-muted-foreground">Address</Label>
                      <Textarea
                        id="clientAddress"
                        value={editedInvoice.client?.address || ''}
                        onChange={(e) => setEditedInvoice(prev => ({
                          ...prev,
                          client: { ...prev.client, address: e.target.value }
                        }))}
                        className="mt-1 bg-background/80 border-border/60 focus:border-primary/60 focus:ring-primary/20"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="bg-gradient-to-br from-secondary/5 to-accent/5 rounded-xl p-6 border border-border/50">
                  <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-secondary" />
                    Invoice Items
                  </h4>
                  <div className="space-y-4">
                    {editedInvoice.items?.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-background/60 rounded-lg border border-border/40">
                        <div className="md:col-span-1">
                          <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                          <Input
                            value={item.description || ''}
                            onChange={(e) => {
                              const newItems = [...editedInvoice.items];
                              newItems[index] = { ...newItems[index], description: e.target.value };
                              setEditedInvoice(prev => ({ ...prev, items: newItems }));
                            }}
                            className="mt-1 bg-background/80 border-border/60 focus:border-secondary/60 focus:ring-secondary/20"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Qty/Hours</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity || 0}
                            onChange={(e) => {
                              const newItems = [...editedInvoice.items];
                              const quantity = parseFloat(e.target.value) || 0;
                              const rate = parseFloat(newItems[index].rate) || 0;
                              newItems[index] = { 
                                ...newItems[index], 
                                quantity, 
                                amount: quantity * rate 
                              };
                              // Recalculate totals
                              const subtotal = newItems.reduce((sum, itm) => sum + (parseFloat(itm.amount) || 0), 0);
                              const tax = (subtotal * (editedInvoice.taxPercentage || 0)) / 100;
                              const total = subtotal + tax - (editedInvoice.discount || 0) + (editedInvoice.shipping || 0);
                              setEditedInvoice(prev => ({ ...prev, items: newItems, subtotal, tax, total }));
                            }}
                            className="mt-1 bg-background/80 border-border/60 focus:border-secondary/60 focus:ring-secondary/20"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Rate ({editedInvoice.currency})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.rate || 0}
                            onChange={(e) => {
                              const newItems = [...editedInvoice.items];
                              const rate = parseFloat(e.target.value) || 0;
                              const quantity = parseFloat(newItems[index].quantity) || 0;
                              newItems[index] = { 
                                ...newItems[index], 
                                rate, 
                                amount: quantity * rate 
                              };
                              // Recalculate totals
                              const subtotal = newItems.reduce((sum, itm) => sum + (parseFloat(itm.amount) || 0), 0);
                              const tax = (subtotal * (editedInvoice.taxPercentage || 0)) / 100;
                              const total = subtotal + tax - (editedInvoice.discount || 0) + (editedInvoice.shipping || 0);
                              setEditedInvoice(prev => ({ ...prev, items: newItems, subtotal, tax, total }));
                            }}
                            className="mt-1 bg-background/80 border-border/60 focus:border-secondary/60 focus:ring-secondary/20"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Amount ({editedInvoice.currency})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={Number(item.amount || 0).toFixed(2)}
                            readOnly
                            className="mt-1 bg-muted/40 border-border/40 text-muted-foreground cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invoice Totals */}
                <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl p-6 border border-border/50">
                  <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-accent" />
                    Invoice Totals
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tax Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editedInvoice.taxPercentage || 0}
                        onChange={(e) => {
                          const taxPercentage = parseFloat(e.target.value) || 0;
                          const subtotal = editedInvoice.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
                          const tax = (subtotal * taxPercentage) / 100;
                          const total = subtotal + tax - (editedInvoice.discount || 0) + (editedInvoice.shipping || 0);
                          setEditedInvoice(prev => ({ 
                            ...prev, 
                            taxPercentage, 
                            tax, 
                            subtotal,
                            total 
                          }));
                        }}
                        className="mt-1 bg-background/80 border-border/60 focus:border-accent/60 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Discount ({editedInvoice.currency})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedInvoice.discount || 0}
                        onChange={(e) => {
                          const discount = parseFloat(e.target.value) || 0;
                          const subtotal = editedInvoice.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
                          const tax = (subtotal * (editedInvoice.taxPercentage || 0)) / 100;
                          const total = subtotal + tax - discount + (editedInvoice.shipping || 0);
                          setEditedInvoice(prev => ({ 
                            ...prev, 
                            discount,
                            total 
                          }));
                        }}
                        className="mt-1 bg-background/80 border-border/60 focus:border-accent/60 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Shipping ({editedInvoice.currency})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedInvoice.shipping || 0}
                        onChange={(e) => {
                          const shipping = parseFloat(e.target.value) || 0;
                          const subtotal = editedInvoice.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
                          const tax = (subtotal * (editedInvoice.taxPercentage || 0)) / 100;
                          const total = subtotal + tax - (editedInvoice.discount || 0) + shipping;
                          setEditedInvoice(prev => ({ 
                            ...prev, 
                            shipping,
                            total 
                          }));
                        }}
                        className="mt-1 bg-background/80 border-border/60 focus:border-accent/60 focus:ring-accent/20"
                      />
                    </div>
                  </div>
                  
                  {/* Summary Totals */}
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium text-foreground">
                          {editedInvoice.currency} {Number(editedInvoice.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Tax ({editedInvoice.taxPercentage || 0}%):</span>
                        <span className="font-medium text-foreground">
                          {editedInvoice.currency} {Number(editedInvoice.tax || 0).toFixed(2)}
                        </span>
                      </div>
                      {(editedInvoice.discount || 0) > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Discount:</span>
                          <span className="font-medium text-red-600">
                            -{editedInvoice.currency} {Number(editedInvoice.discount || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {(editedInvoice.shipping || 0) > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Shipping:</span>
                          <span className="font-medium text-foreground">
                            {editedInvoice.currency} {Number(editedInvoice.shipping || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-border/50">
                        <span className="text-foreground">Total:</span>
                        <span className="text-primary">
                          {editedInvoice.currency} {Number(editedInvoice.total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-gradient-to-br from-muted/20 to-background/50 rounded-xl p-6 border border-border/50">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Invoice Notes</h4>
                  <Textarea
                    value={editedInvoice.notes || ''}
                    onChange={(e) => setEditedInvoice(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional notes or terms..."
                    className="bg-background/80 border-border/60 focus:border-primary/60 focus:ring-primary/20"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Professional Action Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={handleSaveInvoice}
                  disabled={isSaving}
                  size="lg"
                  className="h-12 btn-gradient-primary text-white"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Save to Dashboard
                    </div>
                  )}
                </Button>
                
                <Button
                  onClick={handleDownloadInvoice}
                  variant="outline"
                  size="lg"
                  className="h-12 border-2 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </div>
                </Button>
                
                <Button
                  onClick={() => {
                    setGeneratedInvoice(null);
                    setSearchQuery('');
                    setSelectedClientId('');
                  }}
                  variant="outline"
                  size="lg"
                  className="h-12 border-2 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Invoice
                  </div>
                </Button>
              </div>
            </div>

            {/* Modification Section */}
            <Card className="border border-orange-200 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Modify Invoice</h3>
                </div>
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <textarea
                    placeholder="Describe modifications needed (e.g., change rate to $120/hour, add 15% tax, adjust due date to 14 days)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isGenerating}
                    rows={3}
                    className="w-full p-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                  />
                  <Button
                    type="submit"
                    disabled={!searchQuery.trim() || isGenerating}
                    className="btn-gradient-primary text-white"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Update Invoice
                    </div>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AutomationPage;