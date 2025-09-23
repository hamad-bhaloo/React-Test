import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { format } from 'date-fns';
import InvoiceActions from './InvoiceActions';

interface InvoiceTableWithPaginationProps {
  invoices: any[];
  onView: (invoice: any) => void;
  onEdit: (invoice: any) => void;
  onDelete: (invoice: any) => void;
}

const InvoiceTableWithPagination = ({ invoices, onView, onEdit, onDelete }: InvoiceTableWithPaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination logic
  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = invoices.slice(startIndex, endIndex);

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

  const getClientName = (invoice: any) => {
    return invoice.clients?.name || 
           `${invoice.clients?.first_name || ''} ${invoice.clients?.last_name || ''}`.trim() ||
           invoice.clients?.company || 
           'Unknown';
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => goToPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => goToPage(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis or nearby pages
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <span className="px-3 py-2">...</span>
          </PaginationItem>
        );
      }

      // Show current page and adjacent pages
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => goToPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis or nearby pages
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <span className="px-3 py-2">...</span>
          </PaginationItem>
        );
      }

      // Always show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => goToPage(totalPages)}
              isActive={currentPage === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Invoice #</TableHead>
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Issue Date</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Payment</TableHead>
              <TableHead className="font-semibold w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-primary">
                  {invoice.invoice_number}
                </TableCell>
                <TableCell className="max-w-32">
                  <div className="truncate" title={getClientName(invoice)}>
                    {getClientName(invoice)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold">
                    {invoice.currency} {invoice.total_amount?.toFixed(2) || '0.00'}
                  </div>
                  {invoice.payment_status === 'partially_paid' && invoice.paid_amount > 0 && (
                    <div className="text-xs text-green-600">
                      Paid: {invoice.currency} {invoice.paid_amount?.toFixed(2) || '0.00'}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-sm">
                  <div className={new Date(invoice.due_date) < new Date() && invoice.payment_status !== 'paid' ? 'text-red-600 font-medium' : ''}>
                    {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(invoice.status || 'draft')} text-xs`}>
                    {invoice.status || 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${getPaymentStatusColor(invoice.payment_status || 'unpaid')} text-xs`}>
                    {invoice.payment_status?.replace('_', ' ') || 'Unpaid'}
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, invoices.length)} of {invoices.length} entries
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceTableWithPagination;