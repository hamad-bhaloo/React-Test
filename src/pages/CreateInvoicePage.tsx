import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, ArrowLeft, UserPlus, Bot } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useInvoiceNumber } from '@/hooks/useInvoiceNumber';
import { useSubscription } from '@/hooks/useSubscription';
import ImprovedPlanLimitsChecker from '@/components/ImprovedPlanLimitsChecker';
import AddClientModal from '@/components/AddClientModal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import confetti from 'canvas-confetti';
import { CurvedArrow } from '@/components/CurvedArrow';
import { CurrencyCombobox } from '@/components/ui/currency-combobox';

const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: clients = [] } = useClients();
  const createInvoice = useCreateInvoice();
  const { settings, getInvoiceDefaults } = useUserSettings();
  const { usageCounts, planLimits } = useSubscription();

  // Get user's invoice defaults
  const invoiceDefaults = getInvoiceDefaults();
  
  // Get the next invoice number
  const { data: nextInvoiceNumber, isLoading: isLoadingInvoiceNumber } = useInvoiceNumber(
    invoiceDefaults.prefix, 
    invoiceDefaults.numbering
  );

  // Check if we can create invoices
  const canCreateInvoice = planLimits.max_invoices === -1 || usageCounts.invoices < planLimits.max_invoices;

  const [formData, setFormData] = useState({
    invoice_number: '',
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + (invoiceDefaults.paymentTerms * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    currency: invoiceDefaults.currency,
    tax_percentage: invoiceDefaults.taxRate,
    discount_percentage: 0,
    shipping_charge: 0,
    notes: '',
    terms: '',
    status: 'draft',
    payment_status: 'unpaid',
    is_recurring: false,
    recurring_frequency: 'monthly',
    recurring_end_date: ''
  });

  const [items, setItems] = useState([
    { product_name: '', description: '', quantity: 1, quantity_unit: 'hours', rate: 0, amount: 0 }
  ]);

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [latestClientId, setLatestClientId] = useState<string | null>(null);

  // Set invoice number when it's loaded
  useEffect(() => {
    if (nextInvoiceNumber && !formData.invoice_number) {
      setFormData(prev => ({
        ...prev,
        invoice_number: nextInvoiceNumber,
        currency: invoiceDefaults.currency,
        tax_percentage: invoiceDefaults.taxRate,
        due_date: new Date(Date.now() + (invoiceDefaults.paymentTerms * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      }));
    }
  }, [nextInvoiceNumber, invoiceDefaults, formData.invoice_number]);

  // Auto-select newly created client
  useEffect(() => {
    if (latestClientId && clients.length > 0) {
      const newClient = clients.find(client => client.id === latestClientId);
      if (newClient) {
        setFormData(prev => ({ ...prev, client_id: latestClientId }));
        setLatestClientId(null);
        toast.success(`Client "${newClient.name || `${newClient.first_name} ${newClient.last_name}` || newClient.company}" selected`);
      }
    }
  }, [clients, latestClientId]);

  // Redirect if limit is reached
  useEffect(() => {
    if (!canCreateInvoice) {
      toast.error('Invoice limit reached. Please upgrade your plan to create more invoices.');
      navigate('/invoices');
    }
  }, [canCreateInvoice, navigate]);

  const calculateItemAmount = (quantity: number, rate: number) => {
    return quantity * rate;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * formData.discount_percentage) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * formData.tax_percentage) / 100;
    const total = taxableAmount + taxAmount + formData.shipping_charge;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = calculateItemAmount(
        updatedItems[index].quantity,
        updatedItems[index].rate
      );
    }
    
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { product_name: '', description: '', quantity: 1, quantity_unit: 'hours', rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateInvoice) {
      toast.error('Invoice limit reached. Please upgrade your plan.');
      return;
    }
    
    if (!formData.client_id) {
      toast.error('Please select a client');
      return;
    }

    if (items.some(item => !item.product_name)) {
      toast.error('Please fill in all item names');
      return;
    }

    const totals = calculateTotals();

    const invoiceData = {
      ...formData,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      total_amount: totals.total,
      invoice_items: items.filter(item => item.product_name)
    };

    try {
      const result = await createInvoice.mutateAsync(invoiceData);
      
      // Check if this might be the user's first invoice and send congratulations email
      try {
        await supabase.functions.invoke('send-first-invoice-congratulations', {
          body: {
            userId: user?.id,
            invoiceId: result.id,
            invoiceNumber: formData.invoice_number
          }
        });
      } catch (emailError) {
        console.error('Error sending congratulations email:', emailError);
        // Don't fail invoice creation if email fails
      }
      
      // Trigger confetti for invoice creation celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      navigate('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleCreateClient = () => {
    setIsAddClientModalOpen(true);
  };

  const handleClientModalClose = () => {
    setIsAddClientModalOpen(false);
    // Find the most recently created client (last in the array after sorting by created_at)
    if (clients.length > 0) {
      const sortedClients = [...clients].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setLatestClientId(sortedClients[0].id);
    }
  };

  const totals = calculateTotals();

  if (isLoadingInvoiceNumber) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Limits Alert */}
      <ImprovedPlanLimitsChecker type="invoices" current={usageCounts.invoices} />
      
      <div className="flex items-center gap-4 relative">
        <Button variant="outline" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Invoices
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
        <div className="ml-auto relative inline-block">
          <Button 
            onClick={() => navigate('/automation')}
            className="ai-button transition-all duration-300"
          >
            <Bot size={16} className="mr-2" />
            Create with AI
          </Button>
          <CurvedArrow 
            className="absolute -left-36 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block" 
            direction="right"
            animated={true}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated with prefix: {invoiceDefaults.prefix}
                  </p>
                </div>
                <div>
                  <Label htmlFor="client_id">Client</Label>
                  <div className="flex gap-2">
                    <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name || `${client.first_name} ${client.last_name}` || client.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCreateClient}
                      title="Create new client"
                    >
                      <UserPlus size={16} />
                    </Button>
                  </div>
                  {clients.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      No clients found. Create your first client to continue.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: {invoiceDefaults.paymentTerms} days
                  </p>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <div className="mt-1">
                    <CurrencyCombobox 
                      value={formData.currency}
                      onValueChange={(currency) => setFormData({...formData, currency})}
                      placeholder="Select currency"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Default: {invoiceDefaults.currency}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formData.currency} {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formData.currency} {totals.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({formData.tax_percentage}%):</span>
                  <span>{formData.currency} {totals.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formData.currency} {formData.shipping_charge.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formData.currency} {totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-3">
                    <Label>Product Name</Label>
                    <Input
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      placeholder="Product or service name"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Unit</Label>
                    <Select value={item.quantity_unit || 'hours'} onValueChange={(value) => handleItemChange(index, 'quantity_unit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="items">Items</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="session">Session</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="license">License</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="lbs">Lbs</SelectItem>
                        <SelectItem value="tons">Tons</SelectItem>
                        <SelectItem value="meters">Meters</SelectItem>
                        <SelectItem value="feet">Feet</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="gallons">Gallons</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="packs">Packs</SelectItem>
                        <SelectItem value="sets">Sets</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                        <SelectItem value="lot">Lot</SelectItem>
                        <SelectItem value="each">Each</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Rate ({formData.currency})</Label>
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Amount ({formData.currency})</Label>
                    <Input
                      value={item.amount.toFixed(2)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus size={16} className="mr-2" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tax_percentage">Tax Percentage (%)</Label>
                <Input
                  id="tax_percentage"
                  type="number"
                  value={formData.tax_percentage}
                  onChange={(e) => setFormData({...formData, tax_percentage: Number(e.target.value)})}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: {invoiceDefaults.taxRate}%
                </p>
              </div>
              <div>
                <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({...formData, discount_percentage: Number(e.target.value)})}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="shipping_charge">Shipping Charge</Label>
                <Input
                  id="shipping_charge"
                  type="number"
                  value={formData.shipping_charge}
                  onChange={(e) => setFormData({...formData, shipping_charge: Number(e.target.value)})}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Add any notes for this invoice"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"  
                value={formData.terms}
                onChange={(e) => setFormData({...formData, terms: e.target.value})}
                placeholder="Payment terms and conditions"
                rows={3}
              />
            </div>
            
            {/* Recurring Invoice Settings */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is_recurring" 
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked as boolean})}
                />
                <Label htmlFor="is_recurring" className="text-sm font-medium">
                  Make this invoice recurring
                </Label>
              </div>
              
              {formData.is_recurring && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <Label htmlFor="recurring_frequency">Recurring Frequency</Label>
                    <Select value={formData.recurring_frequency} onValueChange={(value) => setFormData({...formData, recurring_frequency: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="recurring_end_date">End Date (Optional)</Label>
                    <Input
                      id="recurring_end_date"
                      type="date"
                      value={formData.recurring_end_date}
                      onChange={(e) => setFormData({...formData, recurring_end_date: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for indefinite recurring
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createInvoice.isPending || !canCreateInvoice}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={handleClientModalClose}
      />
    </div>
  );
};

export default CreateInvoicePage;
