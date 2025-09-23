import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import InvoiceActions from './InvoiceActions';

interface InvoiceTableProps {
  invoices: any[];
  onView: (invoice: any) => void;
  onEdit: (invoice: any) => void;
  onDelete: (invoice: any) => void;
}

const InvoiceTable = ({ invoices, onView, onEdit, onDelete }: InvoiceTableProps) => {
  const getStatusColor = (invoice: any) => {
    const paymentStatus = invoice.payment_status?.toLowerCase();
    const invoiceStatus = invoice.status?.toLowerCase();
    
    if (paymentStatus === 'paid') {
      return 'bg-success/10 text-success border-success/20';
    } else if (new Date(invoice.due_date) < new Date() && paymentStatus !== 'paid') {
      return 'bg-destructive/10 text-destructive border-destructive/20';
    } else if (paymentStatus === 'partially_paid') {
      return 'bg-warning/10 text-warning border-warning/20';
    } else if (invoiceStatus === 'sent') {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    } else {
      return 'bg-muted/50 text-muted-foreground border-muted';
    }
  };

  const getStatusLabel = (invoice: any) => {
    const paymentStatus = invoice.payment_status?.toLowerCase();
    const invoiceStatus = invoice.status?.toLowerCase();
    
    if (paymentStatus === 'paid') return 'Paid';
    if (new Date(invoice.due_date) < new Date() && paymentStatus !== 'paid') return 'Overdue';
    if (paymentStatus === 'partially_paid') return 'Partial';
    if (invoiceStatus === 'sent') return 'Sent';
    return 'Draft';
  };

  const getClientName = (invoice: any) => {
    return invoice.clients?.name || 
           `${invoice.clients?.first_name || ''} ${invoice.clients?.last_name || ''}`.trim() ||
           invoice.clients?.company || 
           'Unknown';
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-medium">Invoice</TableHead>
              <TableHead className="font-medium">Client</TableHead>
              <TableHead className="font-medium">Amount</TableHead>
              <TableHead className="font-medium">Due Date</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="font-medium text-primary">
                    #{invoice.invoice_number}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(invoice.issue_date), 'MMM dd')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium truncate max-w-32" title={getClientName(invoice)}>
                    {getClientName(invoice)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold">
                    {invoice.currency} {invoice.total_amount?.toFixed(2) || '0.00'}
                  </div>
                  {invoice.payment_status === 'partially_paid' && invoice.paid_amount > 0 && (
                    <div className="text-xs text-success">
                      {invoice.currency} {invoice.paid_amount?.toFixed(2)} paid
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className={`text-sm ${new Date(invoice.due_date) < new Date() && invoice.payment_status !== 'paid' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(invoice)} text-xs border`}>
                    {getStatusLabel(invoice)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <InvoiceActions 
                    invoice={invoice}
                    onView={() => onView(invoice)}
                    onEdit={() => onEdit(invoice)}
                    onDelete={() => onDelete(invoice)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default InvoiceTable;