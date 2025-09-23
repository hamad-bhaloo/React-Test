import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Send, Edit, Share2, FileText } from 'lucide-react';
import { useQuotation, useConvertQuotationToInvoice } from '@/hooks/useQuotations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const ViewQuotationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: quotation, isLoading, error } = useQuotation(id!);
  const convertToInvoice = useConvertQuotationToInvoice();
  const [isConverting, setIsConverting] = useState(false);
  const { user } = useAuth();

  const { data: company } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleConvertToInvoice = async () => {
    if (!quotation) return;
    
    setIsConverting(true);
    try {
      const invoiceData = await convertToInvoice.mutateAsync(quotation.id);
      toast.success('Quotation converted to invoice successfully!');
      navigate(`/invoices/view/${invoiceData.id}`);
    } catch (error) {
      console.error('Error converting quotation:', error);
      toast.error('Failed to convert quotation to invoice');
    } finally {
      setIsConverting(false);
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

  if (error || !quotation) {
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
            <p className="text-gray-600">The quotation you're looking for doesn't exist or has been removed.</p>
            <p className="text-sm text-gray-500 mt-2">Error: {error?.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const client = quotation.clients;
  const items = quotation.quotation_items || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const canConvert = quotation.status === 'accepted' && !quotation.converted_to_invoice_id;
  const isQuotationExpired = isExpired(quotation.valid_until);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/quotations')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Quotations
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quotation {quotation.quotation_number}
            </h1>
            <div className="flex gap-2 mt-2">
              <Badge className={getStatusColor(quotation.status)}>
                {quotation.status?.toUpperCase()}
              </Badge>
              {isQuotationExpired && (
                <Badge className="bg-red-100 text-red-800">EXPIRED</Badge>
              )}
              {quotation.converted_to_invoice_id && (
                <Badge className="bg-blue-100 text-blue-800">CONVERTED</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canConvert && (
            <Button 
              onClick={handleConvertToInvoice}
              disabled={isConverting}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileText size={16} className="mr-2" />
              {isConverting ? 'Converting...' : 'Convert to Invoice'}
            </Button>
          )}
          {quotation.converted_to_invoice_id && (
            <Button 
              variant="outline"
              onClick={() => navigate(`/invoices/view/${quotation.converted_to_invoice_id}`)}
            >
              <FileText size={16} className="mr-2" />
              View Invoice
            </Button>
          )}
          <Button onClick={() => navigate(`/quotations/edit/${quotation.id}`)}>
            <Edit size={16} className="mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quotation Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quotation Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">From:</h3>
                {company ? (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{company.name}</p>
                    {company.email && <p>{company.email}</p>}
                    {company.phone && <p>{company.phone}</p>}
                    {company.address && (
                      <div>
                        <p>{company.address}</p>
                        <p>{[company.city, company.state, company.zip_code].filter(Boolean).join(', ')}</p>
                        {company.country && <p>{company.country}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Company details not available</p>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">To:</h3>
                {client ? (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.company}
                    </p>
                    {client.email && <p>{client.email}</p>}
                    {client.phone && <p>{client.phone}</p>}
                    {client.address && (
                      <div>
                        <p>{client.address}</p>
                        <p>{[client.city, client.state, client.zip_code].filter(Boolean).join(', ')}</p>
                        {client.country && <p>{client.country}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Client details not available</p>
                )}
              </div>
            </div>

            {/* Quotation Info */}
            <div className="grid grid-cols-4 gap-4 py-4 border-t border-b">
              <div>
                <p className="text-sm font-medium text-gray-500">Issue Date</p>
                <p className="font-semibold">{format(new Date(quotation.issue_date), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Valid Until</p>
                <p className={`font-semibold ${isQuotationExpired ? 'text-red-600' : ''}`}>
                  {format(new Date(quotation.valid_until), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Currency</p>
                <p className="font-semibold">{quotation.currency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge className={getStatusColor(quotation.status)}>
                  {quotation.status?.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="font-semibold mb-4">Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Product/Service</th>
                      <th className="text-left py-2 px-3">Description</th>
                      <th className="text-right py-2 px-3">Qty</th>
                      <th className="text-right py-2 px-3">Rate</th>
                      <th className="text-right py-2 px-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-3 font-medium">{item.product_name}</td>
                        <td className="py-2 px-3 text-gray-600">{item.description}</td>
                        <td className="py-2 px-3 text-right">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">{quotation.currency} {Number(item.rate).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">{quotation.currency} {Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes and Terms */}
            {(quotation.notes || quotation.terms) && (
              <div className="space-y-4 pt-4 border-t">
                {quotation.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-gray-600">{quotation.notes}</p>
                  </div>
                )}
                {quotation.terms && (
                  <div>
                    <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                    <p className="text-sm text-gray-600">{quotation.terms}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{quotation.currency} {Number(quotation.subtotal || 0).toFixed(2)}</span>
              </div>
              {Number(quotation.discount_amount || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{quotation.currency} {Number(quotation.discount_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(quotation.tax_amount || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({quotation.tax_percentage}%):</span>
                  <span>{quotation.currency} {Number(quotation.tax_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(quotation.shipping_charge || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{quotation.currency} {Number(quotation.shipping_charge).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{quotation.currency} {Number(quotation.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewQuotationPage;