
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import InvoiceActions from './InvoiceActions';

interface InvoiceCardProps {
  invoice: any;
  onView: (invoice: any) => void;
  onEdit: (invoice: any) => void;
  onDelete: (invoice: any) => void;
}

const InvoiceCard = ({ invoice, onView, onEdit, onDelete }: InvoiceCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {invoice.invoice_number}
              </h3>
              <Badge className={`${getStatusColor(invoice.status || 'draft')} text-xs px-2 py-1`}>
                {invoice.status || 'Draft'}
              </Badge>
              <Badge className={`${getPaymentStatusColor(invoice.payment_status || 'unpaid')} text-xs px-2 py-1`}>
                {invoice.payment_status?.replace('_', ' ') || 'Unpaid'}
              </Badge>
              {invoice.is_recurring && (
                <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                  🔄 {invoice.recurring_frequency || 'Recurring'}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
              <div className="min-w-0">
                <span className="text-gray-500 text-xs font-medium block">Client</span>
                <div className="text-gray-900 truncate">
                  {invoice.clients?.name || 
                   `${invoice.clients?.first_name || ''} ${invoice.clients?.last_name || ''}`.trim() ||
                   invoice.clients?.company || 
                   'Unknown'}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500 text-xs font-medium block">Amount</span>
                <div className="text-sm font-semibold text-gray-900">
                  {invoice.currency} {invoice.total_amount?.toFixed(2) || '0.00'}
                </div>
                {invoice.payment_status === 'partially_paid' && invoice.paid_amount > 0 && (
                  <div className="text-xs text-green-600">
                    Paid: {invoice.currency} {invoice.paid_amount?.toFixed(2) || '0.00'}
                  </div>
                )}
              </div>
              
              <div>
                <span className="text-gray-500 text-xs font-medium block">Issue Date</span>
                <div className="text-gray-900">{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</div>
              </div>
              
              <div>
                <span className="text-gray-500 text-xs font-medium block">Due Date</span>
                <div className={new Date(invoice.due_date) < new Date() && invoice.payment_status !== 'paid' ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <InvoiceActions 
                  invoice={invoice}
                  onView={() => onView(invoice)}
                  onEdit={() => onEdit(invoice)}
                  onDelete={() => onDelete(invoice)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceCard;
