import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, MoreHorizontal, FileText, Send } from 'lucide-react';
import SendQuotationModal from './SendQuotationModal';

interface QuotationTableWithPaginationProps {
  quotations: any[];
  onView: (quotation: any) => void;
  onEdit: (quotation: any) => void;
  onDelete: (quotation: any) => void;
  onConvertToInvoice: (quotation: any) => void;
  onSendSuccess?: () => void;
}

const QuotationTableWithPagination = ({ 
  quotations, 
  onView, 
  onEdit, 
  onDelete, 
  onConvertToInvoice,
  onSendSuccess
}: QuotationTableWithPaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(quotations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuotations = quotations.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientName = (quotation: any) => {
    return quotation.clients?.name || 
           `${quotation.clients?.first_name || ''} ${quotation.clients?.last_name || ''}`.trim() ||
           quotation.clients?.company || 
           'Unknown';
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const canSend = (quotation: any) => {
    return quotation.status === 'draft' || quotation.status === 'sent';
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <PaginationItem key={page}>
          <PaginationLink
            onClick={() => goToPage(page)}
            isActive={page === currentPage}
            className="cursor-pointer"
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (quotations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No quotations found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Quotation #</TableHead>
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Issue Date</TableHead>
                <TableHead className="font-semibold">Valid Until</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentQuotations.map((quotation) => (
                <TableRow key={quotation.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-primary">
                    {quotation.quotation_number}
                  </TableCell>
                  <TableCell className="max-w-32">
                    <div className="truncate" title={getClientName(quotation)}>
                      {getClientName(quotation)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">
                      {quotation.currency} {quotation.total_amount?.toFixed(2) || '0.00'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(quotation.issue_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className={isExpired(quotation.valid_until) && quotation.status !== 'converted' && quotation.status !== 'accepted' ? 'text-red-600 font-medium' : ''}>
                      {format(new Date(quotation.valid_until), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(quotation.status || 'draft')} text-xs`}>
                      {quotation.status === 'converted' ? 'Converted' : 
                       quotation.status === 'accepted' ? 'Accepted' :
                       quotation.status === 'sent' ? 'Sent' :
                       quotation.status === 'declined' ? 'Declined' :
                       quotation.status === 'expired' ? 'Expired' :
                       'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem onClick={() => onView(quotation)}>
                          <Eye size={14} className="mr-2" />
                          View
                        </DropdownMenuItem>
                        {quotation.status !== 'converted' && (
                          <DropdownMenuItem onClick={() => onEdit(quotation)}>
                            <Edit size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canSend(quotation) && (
                          <SendQuotationModal quotation={quotation} onSuccess={onSendSuccess}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Send size={14} className="mr-2" />
                              Send
                            </DropdownMenuItem>
                          </SendQuotationModal>
                        )}
                        {(quotation.status === 'accepted' || quotation.status === 'sent') && quotation.status !== 'converted' && (
                          <DropdownMenuItem onClick={() => onConvertToInvoice(quotation)}>
                            <FileText size={14} className="mr-2" />
                            Convert to Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onDelete(quotation)}
                          className="text-red-600"
                        >
                          <Trash2 size={14} className="mr-2" />
                          {quotation.status === 'converted' ? 'Remove' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, quotations.length)} of {quotations.length} quotations
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => goToPage(currentPage - 1)}
                  className={`cursor-pointer ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
              
              {renderPaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => goToPage(currentPage + 1)}
                  className={`cursor-pointer ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default QuotationTableWithPagination;