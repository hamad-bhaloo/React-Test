
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, UserPlus, Palette, CalendarIcon, Sparkles } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useSubscription } from '@/hooks/useSubscription';
import { useInvoiceNumber } from '@/hooks/useInvoiceNumber';
import { useUserSettings } from '@/hooks/useUserSettings';
import ImprovedPlanLimitsChecker from '@/components/ImprovedPlanLimitsChecker';
import SmartAutoComplete from '@/components/ai/SmartAutoComplete';
import ContextualInvoiceGenerator from '@/components/ai/ContextualInvoiceGenerator';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClient: () => void;
}

interface InvoiceItem {
  id: string;
  product_name: string;
  description: string;
  quantity: number;
  quantity_unit: string;
  rate: number;
  amount: number;
}

const CreateInvoiceModal = ({ isOpen, onClose, onCreateClient }: CreateInvoiceModalProps) => {
  const { data: clients = [] } = useClients();
  const createInvoiceMutation = useCreateInvoice();
  const { usageCounts, planLimits } = useSubscription();
  const { getInvoiceDefaults } = useUserSettings();
  
  // Get invoice defaults from settings
  const invoiceDefaults = getInvoiceDefaults();
  const { data: nextInvoiceNumber } = useInvoiceNumber(invoiceDefaults.prefix, invoiceDefaults.numbering);

  // Check if we can create invoices
  const canCreateInvoice = planLimits.max_invoices === -1 || usageCounts.invoices < planLimits.max_invoices;

  // Get selected template from localStorage
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [dueDateOption, setDueDateOption] = useState<string>(invoiceDefaults.paymentTerms.toString());
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const getCurrentDate = () => new Date().toISOString().split('T')[0];
  
  const generateInvoiceNumber = () => {
    // This will be replaced by the actual hook data when available
    return 'INV-0001';
  };

  const [formData, setFormData] = useState({
    invoice_number: nextInvoiceNumber || 'INV-0001',
    client_id: '',
    issue_date: getCurrentDate(),
    due_date: format(addDays(new Date(), invoiceDefaults.paymentTerms), 'yyyy-MM-dd'),
    currency: invoiceDefaults.currency,
    tax_percentage: invoiceDefaults.taxRate,
    discount_percentage: 0,
    shipping_charge: 0,
    notes: '',
    is_recurring: false,
    recurring_frequency: '',
    recurring_end_date: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', product_name: '', description: '', quantity: 1, quantity_unit: 'hours', rate: 0, amount: 0 }
  ]);

  // Load selected template on modal open
  useEffect(() => {
    if (isOpen) {
      const savedTemplate = localStorage.getItem('selectedInvoiceTemplate');
      if (savedTemplate) {
        setSelectedTemplate(savedTemplate);
      }
      
      // Reset form when opening
      setFormData({
        invoice_number: nextInvoiceNumber || 'INV-0001',
        client_id: '',
        issue_date: getCurrentDate(),
        due_date: format(addDays(new Date(), invoiceDefaults.paymentTerms), 'yyyy-MM-dd'),
        currency: invoiceDefaults.currency,
        tax_percentage: invoiceDefaults.taxRate,
        discount_percentage: 0,
        shipping_charge: 0,
        notes: '',
        is_recurring: false,
        recurring_frequency: '',
        recurring_end_date: '',
      });
      
      setDueDateOption(invoiceDefaults.paymentTerms.toString());
      setShowCustomDatePicker(false);
    }
  }, [isOpen, nextInvoiceNumber, invoiceDefaults]);

  // Close modal if limit is reached
  useEffect(() => {
    if (isOpen && !canCreateInvoice) {
      toast.error('Invoice limit reached. Please upgrade your plan to create more invoices.');
      onClose();
    }
  }, [canCreateInvoice, isOpen, onClose]);

  const handleDueDateOptionChange = (option: string) => {
    setDueDateOption(option);
    const issueDate = new Date(formData.issue_date);
    
    if (option === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      const days = parseInt(option);
      const dueDate = addDays(issueDate, days);
      setFormData(prev => ({ 
        ...prev, 
        due_date: format(dueDate, 'yyyy-MM-dd') 
      }));
    }
  };

  const handleIssueDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, issue_date: date }));
    
    // Update due date if not using custom option
    if (dueDateOption !== 'custom') {
      const issueDate = new Date(date);
      const days = parseInt(dueDateOption);
      const dueDate = addDays(issueDate, days);
      setFormData(prev => ({ 
        ...prev, 
        due_date: format(dueDate, 'yyyy-MM-dd') 
      }));
    }
  };

  const handleCustomDueDateSelect = (date: Date | undefined) => {
    if (date) {
      const selectedDate = format(date, 'yyyy-MM-dd');
      const issueDate = formData.issue_date;
      
      // Prevent selecting due date before issue date
      if (selectedDate < issueDate) {
        toast.error('Due date cannot be earlier than issue date');
        return;
      }
      
      setFormData(prev => ({ ...prev, due_date: selectedDate }));
      setShowCustomDatePicker(false);
    }
  };

  const getTemplateName = (templateId: string) => {
    const templates = {
      '1': 'Classic Professional',
      '2': 'Modern Sidebar',
      '3': 'Creative Geometric',
      '4': 'Minimal Grid',
      '5': 'Tech Card',
      '6': 'Elegant Timeline'
    };
    return templates[templateId as keyof typeof templates] || 'Default Template';
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product_name: '',
      description: '',
      quantity: 1,
      quantity_unit: 'hours',
      rate: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * formData.discount_percentage) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * formData.tax_percentage) / 100;
    const total = taxableAmount + taxAmount + formData.shipping_charge;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!canCreateInvoice) {
      errors.push('Invoice limit reached. Please upgrade your plan.');
    }

    if (!formData.client_id) {
      errors.push('Please select a client from the dropdown');
    }

    if (!formData.due_date) {
      errors.push('Please set a due date for the invoice');
    }

    if (items.some(item => !item.product_name)) {
      errors.push('Please fill in all product/service names');
    }

    if (formData.is_recurring && !formData.recurring_frequency) {
      errors.push('Please select a frequency for the recurring invoice');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

    // Prepare invoice data - DO NOT include template_id to avoid UUID issues
    const invoiceData: any = {
      invoice_number: formData.invoice_number,
      client_id: formData.client_id,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      currency: formData.currency,
      tax_percentage: formData.tax_percentage,
      discount_percentage: formData.discount_percentage,
      shipping_charge: formData.shipping_charge,
      notes: formData.notes,
      is_recurring: formData.is_recurring,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: total,
      status: 'draft',
      payment_status: 'unpaid',
      invoice_items: items.map(({ id, ...item }) => item),
    };

    // Only add recurring fields if recurring is enabled
    if (formData.is_recurring) {
      invoiceData.recurring_frequency = formData.recurring_frequency;
      if (formData.recurring_end_date) {
        invoiceData.recurring_end_date = formData.recurring_end_date;
      }
    }

    try {
      const result = await createInvoiceMutation.mutateAsync(invoiceData);
      
      // Trigger confetti for first invoice celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      onClose();
      // Reset form
      setFormData({
        invoice_number: generateInvoiceNumber(),
        client_id: '',
        issue_date: getCurrentDate(),
        due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        currency: 'USD',
        tax_percentage: 0,
        discount_percentage: 0,
        shipping_charge: 0,
        notes: '',
        is_recurring: false,
        recurring_frequency: '',
        recurring_end_date: '',
      });
      setItems([{ id: '1', product_name: '', description: '', quantity: 1, quantity_unit: 'hours', rate: 0, amount: 0 }]);
      setSelectedTemplate(null);
      setDueDateOption('30');
      setShowCustomDatePicker(false);
      toast.success('Invoice created successfully!');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice. Please check all required fields and try again.');
    }
  };

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

  // Don't render modal if user can't create invoices
  if (!canCreateInvoice) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>

        {/* Plan Limits Alert */}
        <ImprovedPlanLimitsChecker type="invoices" current={usageCounts.invoices} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          {selectedTemplate && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Palette size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Template: {getTemplateName(selectedTemplate)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('selectedInvoiceTemplate');
                    setSelectedTemplate(null);
                  }}
                >
                  Change Template
                </Button>
              </div>
            </div>
          )}

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoice_number">Invoice Number <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, invoice_number: nextInvoiceNumber || 'INV-0001' }))}
                  title="Generate new invoice number"
                >
                  Generate
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="client_id">Client <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <SearchableSelect
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  options={clients.map(client => ({
                    label: client.name || `${client.first_name} ${client.last_name}` || client.company || 'Unnamed Client',
                    value: client.id
                  }))}
                  placeholder="Select client"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onCreateClient}
                  title="Add new client"
                >
                  <UserPlus size={16} />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <SearchableSelect
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
                options={[
                  { label: 'USD - US Dollar', value: 'USD' },
                  { label: 'EUR - Euro', value: 'EUR' },
                  { label: 'GBP - British Pound', value: 'GBP' },
                  { label: 'CAD - Canadian Dollar', value: 'CAD' },
                  { label: 'AUD - Australian Dollar', value: 'AUD' },
                ]}
                placeholder="Select currency"
              />
            </div>

            <div>
              <Label htmlFor="issue_date">Issue Date <span className="text-red-500">*</span></Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleIssueDateChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="due_date">Due Date <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <SearchableSelect
                  value={dueDateOption}
                  onValueChange={handleDueDateOptionChange}
                  options={[
                    { label: '7 days', value: '7' },
                    { label: '15 days', value: '15' },
                    { label: '30 days', value: '30' },
                    { label: 'Custom date', value: 'custom' },
                  ]}
                  placeholder="Select due date"
                />
                
                {dueDateOption === 'custom' && (
                  <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(new Date(formData.due_date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.due_date ? new Date(formData.due_date) : undefined}
                        onSelect={handleCustomDueDateSelect}
                        disabled={(date) => {
                          const issueDate = new Date(formData.issue_date);
                          return date < issueDate;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
                
                {dueDateOption !== 'custom' && (
                  <Input
                    type="date"
                    value={formData.due_date}
                    readOnly
                    className="bg-gray-50"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Recurring Settings */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked, recurring_frequency: checked ? formData.recurring_frequency : '' })}
              />
              <Label htmlFor="is_recurring">Make this a recurring invoice</Label>
            </div>

            {formData.is_recurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurring_frequency">Frequency <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={formData.recurring_frequency}
                    onValueChange={(value) => setFormData({ ...formData, recurring_frequency: value })}
                    options={[
                      { label: 'Monthly', value: 'monthly' },
                      { label: 'Quarterly', value: 'quarterly' },
                      { label: 'Yearly', value: 'yearly' },
                    ]}
                    placeholder="Select frequency"
                  />
                </div>

                <div>
                  <Label htmlFor="recurring_end_date">End Date (Optional)</Label>
                  <Input
                    id="recurring_end_date"
                    type="date"
                    value={formData.recurring_end_date}
                    onChange={(e) => setFormData({ ...formData, recurring_end_date: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Contextual Invoice Generator */}
          {formData.client_id && (
            <ContextualInvoiceGenerator
              clientId={formData.client_id}
              onItemsGenerated={(generatedItems) => {
                const newItems = generatedItems.map((item, index) => ({
                  id: (Date.now() + index).toString(),
                  product_name: item.product_name,
                  description: item.description,
                  quantity: item.quantity,
                  quantity_unit: 'hours',
                  rate: item.rate,
                  amount: item.quantity * item.rate
                }));
                setItems(newItems);
              }}
            />
          )}

          {/* Invoice Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invoice Items</h3>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus size={16} className="mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-4 border rounded-lg">
                  <div className="col-span-3">
                    <Label>Product Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={item.product_name}
                      onChange={(e) => updateItem(item.id, 'product_name', e.target.value)}
                      placeholder="Product name"
                      required
                    />
                    {formData.client_id && (
                      <SmartAutoComplete
                        clientId={formData.client_id}
                        type="product"
                        currentValue={item.product_name}
                        onSuggestionSelect={(suggestion) => updateItem(item.id, 'product_name', suggestion.text)}
                      />
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Description"
                    />
                    {formData.client_id && item.product_name && (
                      <SmartAutoComplete
                        clientId={formData.client_id}
                        type="description"
                        currentValue={item.product_name}
                        onSuggestionSelect={(suggestion) => updateItem(item.id, 'description', suggestion.text)}
                      />
                    )}
                  </div>
                  <div className="col-span-1">
                    <Label>Qty <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Unit</Label>
                    <SearchableSelect
                      value={item.quantity_unit || 'hours'}
                      onValueChange={(value) => updateItem(item.id, 'quantity_unit', value)}
                      options={[
                        { label: 'Hours', value: 'hours' },
                        { label: 'Pieces', value: 'pieces' },
                        { label: 'Days', value: 'days' },
                        { label: 'Weeks', value: 'weeks' },
                        { label: 'Months', value: 'months' },
                        { label: 'Years', value: 'years' },
                        { label: 'Kg', value: 'kg' },
                        { label: 'Lbs', value: 'lbs' },
                        { label: 'Tons', value: 'tons' },
                        { label: 'Meters', value: 'meters' },
                        { label: 'Feet', value: 'feet' },
                        { label: 'Liters', value: 'liters' },
                        { label: 'Gallons', value: 'gallons' },
                        { label: 'Boxes', value: 'boxes' },
                        { label: 'Packs', value: 'packs' },
                        { label: 'Sets', value: 'sets' },
                      ]}
                      placeholder="Select unit"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Rate ({formData.currency}) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      required
                    />
                    {formData.client_id && item.product_name && (
                      <SmartAutoComplete
                        clientId={formData.client_id}
                        type="rate"
                        currentValue={item.product_name}
                        onSuggestionSelect={(suggestion) => updateItem(item.id, 'rate', parseFloat(suggestion.text) || 0)}
                      />
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label>Amount ({formData.currency})</Label>
                    <Input
                      type="number"
                      value={item.amount.toFixed(2)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>&nbsp;</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="w-full"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calculations */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="tax_percentage">Tax Percentage (%)</Label>
                <Input
                  id="tax_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_percentage}
                  onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="shipping_charge">Shipping Charge</Label>
                <Input
                  id="shipping_charge"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipping_charge}
                  onChange={(e) => setFormData({ ...formData, shipping_charge: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>{formData.currency} {subtotal.toFixed(2)}</span>
              </div>
              {formData.discount_percentage > 0 && (
                <div className="flex justify-between mb-2 text-red-600">
                  <span>Discount ({formData.discount_percentage}%):</span>
                  <span>-{formData.currency} {discountAmount.toFixed(2)}</span>
                </div>
              )}
              {formData.tax_percentage > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Tax ({formData.tax_percentage}%):</span>
                  <span>{formData.currency} {taxAmount.toFixed(2)}</span>
                </div>
              )}
              {formData.shipping_charge > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Shipping:</span>
                  <span>{formData.currency} {formData.shipping_charge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formData.currency} {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createInvoiceMutation.isPending || !canCreateInvoice}
            >
              {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceModal;
