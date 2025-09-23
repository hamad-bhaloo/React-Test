import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, MoreHorizontal, FileText } from 'lucide-react';

interface QuotationTableProps {
  quotations: any[];
  onView: (quotation: any) => void;
  onEdit: (quotation: any) => void;
  onDelete: (quotation: any) => void;
  onConvertToInvoice: (quotation: any) => void;
}

const QuotationTable = ({ quotations, onView, onEdit, onDelete, onConvertToInvoice }: QuotationTableProps) => {
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

  return (
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
            {quotations.map((quotation) => (
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
                      {(quotation.status === 'accepted' || quotation.status === 'sent') && quotation.status !== 'converted' && (
                        <DropdownMenuItem onClick={() => onConvertToInvoice(quotation)}>
                          <FileText size={14} className="mr-2" />
                          Convert to Invoice
                        </DropdownMenuItem>
                      )}
                      {quotation.status !== 'converted' && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(quotation)}
                          className="text-red-600"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default QuotationTable;