import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Save, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useQuotation, useUpdateQuotation } from '@/hooks/useQuotations';
import { currencies } from '@/constants/currencies';
import FileUpload from '@/components/quotations/FileUpload';

const quotationSchema = z.object({
  quotationNumber: z.string().min(1, 'Quotation number is required'),
  clientId: z.string().min(1, 'Please select a client'),
  issueDate: z.string().min(1, 'Issue date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  currency: z.string().min(1, 'Currency is required'),
  taxPercentage: z.number().min(0).max(100),
  discountPercentage: z.number().min(0).max(100),
  discountAmount: z.number().min(0),
  shippingCharge: z.number().min(0),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface QuotationItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const EditQuotationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: clients = [] } = useClients();
  const { data: quotation, isLoading } = useQuotation(id!);
  const updateQuotation = useUpdateQuotation();
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      quotationNumber: '',
      currency: 'USD',
      taxPercentage: 0,
      discountPercentage: 0,
      discountAmount: 0,
      shippingCharge: 0,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (quotation) {
      setValue('quotationNumber', quotation.quotation_number || '');
      setValue('clientId', quotation.client_id || '');
      setValue('issueDate', quotation.issue_date || '');
      setValue('validUntil', quotation.valid_until || '');
      setValue('currency', quotation.currency || 'USD');
      setValue('taxPercentage', Number(quotation.tax_percentage) || 0);
      setValue('discountPercentage', Number(quotation.discount_percentage) || 0);
      setValue('discountAmount', Number(quotation.discount_amount) || 0);
      setValue('shippingCharge', Number(quotation.shipping_charge) || 0);
      setValue('terms', quotation.terms || '');
      setValue('notes', quotation.notes || '');

      if (quotation.quotation_items && quotation.quotation_items.length > 0) {
        setItems(quotation.quotation_items.map((item: any) => ({
          id: item.id || Date.now().toString(),
          productName: item.product_name || '',
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
        })));
      } else {
        setItems([{
          id: Date.now().toString(),
          productName: '',
          description: '',
          quantity: 1,
          rate: 0,
          amount: 0,
        }]);
      }
      
      setAttachments(Array.isArray(quotation.attachments) ? quotation.attachments : []);
    }
  }, [quotation, setValue]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = watchedValues.discountPercentage 
    ? (subtotal * watchedValues.discountPercentage) / 100 
    : watchedValues.discountAmount || 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (watchedValues.taxPercentage || 0)) / 100;
  const total = taxableAmount + taxAmount + (watchedValues.shippingCharge || 0);

  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      productName: '',
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: string | number) => {
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

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const onSubmit = async (data: QuotationFormData) => {
    if (items.length === 0 || items.every(item => !item.productName)) {
      toast.error('Please add at least one item to the quotation');
      return;
    }

    try {
      const quotationData = {
        quotation_number: data.quotationNumber,
        client_id: data.clientId,
        issue_date: data.issueDate,
        valid_until: data.validUntil,
        currency: data.currency,
        tax_percentage: data.taxPercentage,
        discount_percentage: data.discountPercentage,
        discount_amount: discountAmount,
        shipping_charge: data.shippingCharge,
        terms: data.terms,
        notes: data.notes,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        attachments: attachments,
      };

      const itemsToUpdate = items.filter(item => item.productName).map(item => ({
        product_name: item.productName,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }));

      await updateQuotation.mutateAsync({
        id: id!,
        updates: {
          ...quotationData,
          quotation_items: itemsToUpdate,
        },
      });

      toast.success('Quotation updated successfully');
      navigate('/quotations');
    } catch (error) {
      console.error('Error updating quotation:', error);
      toast.error('Failed to update quotation');
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

  if (!quotation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/quotations')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Quotations
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Quotation Not Found</h1>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">The quotation you're trying to edit doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/quotations')}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Quotations
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Quotation</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quotation Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quotation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quotationNumber">Quotation Number</Label>
                    <Input
                      id="quotationNumber"
                      {...register('quotationNumber')}
                    />
                    {errors.quotationNumber && (
                      <p className="text-sm text-destructive mt-1">{errors.quotationNumber.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="clientId">Client</Label>
                    <Select onValueChange={(value) => setValue('clientId', value)} value={watchedValues.clientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name || `${client.first_name} ${client.last_name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.clientId && (
                      <p className="text-sm text-destructive mt-1">{errors.clientId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      {...register('issueDate')}
                    />
                    {errors.issueDate && (
                      <p className="text-sm text-destructive mt-1">{errors.issueDate.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      {...register('validUntil')}
                    />
                    {errors.validUntil && (
                      <p className="text-sm text-destructive mt-1">{errors.validUntil.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select onValueChange={(value) => setValue('currency', value)} value={watchedValues.currency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      placeholder="Enter terms and conditions..."
                      {...register('terms')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter additional notes..."
                      {...register('notes')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Items</CardTitle>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-3">
                        <Label>Product/Service</Label>
                        <Input
                          value={item.productName}
                          onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                          placeholder="Product name"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Rate</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Label>Amount</Label>
                        <div className="font-semibold py-2">${item.amount.toFixed(2)}</div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No items added yet. Click "Add Item" to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attachments Section */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  quotationId={id}
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  maxFiles={5}
                  maxSize={10}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quotation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="discountPercentage">Discount %</Label>
                        <Input
                          id="discountPercentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...register('discountPercentage', { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="discountAmount">Discount $</Label>
                        <Input
                          id="discountAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          {...register('discountAmount', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="taxPercentage">Tax %</Label>
                      <Input
                        id="taxPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        {...register('taxPercentage', { valueAsNumber: true })}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="shippingCharge">Shipping</Label>
                      <Input
                        id="shippingCharge"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register('shippingCharge', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={updateQuotation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateQuotation.isPending ? 'Updating...' : 'Update Quotation'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditQuotationPage;