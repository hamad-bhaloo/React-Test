
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface InvoiceViewFormProps {
  invoice: any;
  client: any;
  items: any[];
}

const InvoiceViewForm = ({ invoice, client, items }: InvoiceViewFormProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Invoice Details
            <div className="flex gap-2">
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status?.toUpperCase()}
              </Badge>
              <Badge className={getPaymentStatusColor(invoice.payment_status)}>
                {invoice.payment_status?.toUpperCase()}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <Input value={invoice.invoice_number || ''} readOnly className="bg-gray-50" />
            </div>

            <div>
              <Label>Client</Label>
              <Input 
                value={client?.name || `${client?.first_name || ''} ${client?.last_name || ''}`.trim() || client?.company || 'N/A'} 
                readOnly 
                className="bg-gray-50" 
              />
            </div>

            <div>
              <Label>Issue Date</Label>
              <Input 
                value={invoice.issue_date ? format(new Date(invoice.issue_date), 'yyyy-MM-dd') : ''} 
                readOnly 
                className="bg-gray-50" 
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input 
                value={invoice.due_date ? format(new Date(invoice.due_date), 'yyyy-MM-dd') : ''} 
                readOnly 
                className="bg-gray-50" 
              />
            </div>

            <div>
              <Label>Currency</Label>
              <Input value={invoice.currency || 'USD'} readOnly className="bg-gray-50" />
            </div>

            <div>
              <Label>Template ID</Label>
              <Input value={invoice.template_id || '1'} readOnly className="bg-gray-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      {client && (
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name/Company</Label>
                <Input 
                  value={client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.company || ''} 
                  readOnly 
                  className="bg-gray-50" 
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={client.email || ''} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={client.phone || ''} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={client.address || ''} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>City</Label>
                <Input value={client.city || ''} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={client.state || ''} readOnly className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item: any, index: number) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-3">
                  <Label>Product Name</Label>
                  <Input value={item.product_name || ''} readOnly className="bg-gray-50" />
                </div>
                <div className="col-span-3">
                  <Label>Description</Label>
                  <Input value={item.description || ''} readOnly className="bg-gray-50" />
                </div>
                <div className="col-span-2">
                  <Label>Quantity</Label>
                  <Input value={`${item.quantity || 0} ${item.unit || 'pcs'}`} readOnly className="bg-gray-50" />
                </div>
                <div className="col-span-2">
                  <Label>Rate</Label>
                  <Input value={Number(item.rate || 0).toFixed(2)} readOnly className="bg-gray-50" />
                </div>
                <div className="col-span-2">
                  <Label>Amount</Label>
                  <Input value={Number(item.amount || 0).toFixed(2)} readOnly className="bg-gray-50" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calculations */}
      <Card>
        <CardHeader>
          <CardTitle>Calculations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tax Percentage (%)</Label>
              <Input value={Number(invoice.tax_percentage || 0).toFixed(2)} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label>Discount Percentage (%)</Label>
              <Input value={Number(invoice.discount_percentage || 0).toFixed(2)} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label>Shipping Charge</Label>
              <Input value={Number(invoice.shipping_charge || 0).toFixed(2)} readOnly className="bg-gray-50" />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{invoice.currency || 'USD'} {Number(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{invoice.currency || 'USD'} {Number(invoice.tax_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{invoice.currency || 'USD'} {Number(invoice.discount_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{invoice.currency || 'USD'} {Number(invoice.shipping_charge || 0).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{invoice.currency || 'USD'} {Number(invoice.total_amount || 0).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoice.payments.map((payment: any, index: number) => (
                <div key={payment.id || index} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                  <div className="col-span-3">
                    <Label className="text-sm font-medium">Amount</Label>
                    <div className="text-lg font-semibold text-green-600">
                      {invoice.currency || 'USD'} {Number(payment.amount || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-sm font-medium">Payment Date</Label>
                    <div>{payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : 'N/A'}</div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <div className="capitalize">{payment.payment_method || 'N/A'}</div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-sm font-medium">Notes</Label>
                    <div className="text-sm text-gray-600">{payment.notes || 'No notes'}</div>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                  <div className="text-lg font-semibold text-green-600">
                    {invoice.currency || 'USD'} {Number(invoice.paid_amount || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Remaining Balance</div>
                  <div className="text-lg font-semibold text-red-600">
                    {invoice.currency || 'USD'} {Number((invoice.total_amount || 0) - (invoice.paid_amount || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.notes && (
            <div>
              <Label>Notes</Label>
              <Textarea value={invoice.notes} readOnly className="bg-gray-50" rows={3} />
            </div>
          )}

          {invoice.terms && (
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea value={invoice.terms} readOnly className="bg-gray-50" rows={3} />
            </div>
          )}

          {invoice.is_recurring && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recurring Frequency</Label>
                <Input value={invoice.recurring_frequency || ''} readOnly className="bg-gray-50" />
              </div>
              {invoice.recurring_end_date && (
                <div>
                  <Label>Recurring End Date</Label>
                  <Input 
                    value={format(new Date(invoice.recurring_end_date), 'yyyy-MM-dd')} 
                    readOnly 
                    className="bg-gray-50" 
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceViewForm;
