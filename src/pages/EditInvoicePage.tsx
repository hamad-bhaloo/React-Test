import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, ArrowLeft } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useInvoice, useUpdateInvoice } from '@/hooks/useInvoices';
import { toast } from 'sonner';
import { CurrencyCombobox } from '@/components/ui/currency-combobox';

const EditInvoicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: clients = [] } = useClients();
  const { data: invoice, isLoading } = useInvoice(id!);
  const updateInvoice = useUpdateInvoice();

  const [formData, setFormData] = useState({
    invoice_number: '',
    client_id: '',
    issue_date: '',
    due_date: '',
    currency: 'USD',
    tax_percentage: 0,
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
    { product_name: '', description: '', quantity: 1, unit: 'pcs', rate: 0, amount: 0 }
  ]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number || '',
        client_id: invoice.client_id || '',
        issue_date: invoice.issue_date || '',
        due_date: invoice.due_date || '',
        currency: invoice.currency || 'USD',
        tax_percentage: invoice.tax_percentage ? Number(invoice.tax_percentage) : 0,
        discount_percentage: invoice.discount_percentage ? Number(invoice.discount_percentage) : 0,
        shipping_charge: invoice.shipping_charge ? Number(invoice.shipping_charge) : 0,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        status: invoice.status || 'draft',
        payment_status: invoice.payment_status || 'unpaid',
        is_recurring: invoice.is_recurring || false,
        recurring_frequency: invoice.recurring_frequency || 'monthly',
        recurring_end_date: invoice.recurring_end_date || ''
      });

      if (invoice.invoice_items && invoice.invoice_items.length > 0) {
        setItems(invoice.invoice_items.map((item: any) => ({
          product_name: item.product_name || '',
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'pcs',
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0
        })));
      }
    }
  }, [invoice]);

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
    setItems([...items, { product_name: '', description: '', quantity: 1, unit: 'pcs', rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Convert empty strings to null for date fields to prevent database errors
      issue_date: formData.issue_date || null,
      due_date: formData.due_date || null,
      recurring_end_date: formData.recurring_end_date || null,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      total_amount: totals.total,
      invoice_items: items.filter(item => item.product_name)
    };

    try {
      await updateInvoice.mutateAsync({ id: id!, data: invoiceData });
      navigate('/invoices');
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Not Found</h1>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">The invoice you're trying to edit doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Invoices
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Invoice</h1>
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
                </div>
                <div>
                  <Label htmlFor="client_id">Client</Label>
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
                  <span>Tax:</span>
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
                    <Select value={item.unit || 'pcs'} onValueChange={(value) => handleItemChange(index, 'unit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pcs</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="item">Item</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="session">Session</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="license">License</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                        <SelectItem value="lot">Lot</SelectItem>
                        <SelectItem value="each">Each</SelectItem>
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
                    <Label htmlFor="recurring_frequency">Frequency</Label>
                    <Select 
                      value={formData.recurring_frequency} 
                      onValueChange={(value) => setFormData({...formData, recurring_frequency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={updateInvoice.isPending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {updateInvoice.isPending ? 'Updating...' : 'Update Invoice'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditInvoicePage;
