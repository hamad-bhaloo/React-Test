import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, MoreHorizontal, FileText } from 'lucide-react';

interface QuotationCardProps {
  quotation: any;
  onView: (quotation: any) => void;
  onEdit: (quotation: any) => void;
  onDelete: (quotation: any) => void;
  onConvertToInvoice: (quotation: any) => void;
}

const QuotationCard = ({ quotation, onView, onEdit, onDelete, onConvertToInvoice }: QuotationCardProps) => {
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {quotation.quotation_number}
              </h3>
              <Badge className={`${getStatusColor(quotation.status || 'draft')} text-xs px-2 py-1`}>
                {quotation.status === 'converted' ? 'Converted' : 
                 quotation.status === 'accepted' ? 'Accepted' :
                 quotation.status === 'sent' ? 'Sent' :
                 quotation.status === 'declined' ? 'Declined' :
                 quotation.status === 'expired' ? 'Expired' :
                 'Draft'}
              </Badge>
              {quotation.status === 'accepted' && (
                <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                  Ready to Convert
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
              <div className="min-w-0">
                <span className="text-gray-500 text-xs font-medium block">Client</span>
                <div className="text-gray-900 truncate">
                  {getClientName(quotation)}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500 text-xs font-medium block">Amount</span>
                <div className="text-sm font-semibold text-gray-900">
                  {quotation.currency} {quotation.total_amount?.toFixed(2) || '0.00'}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500 text-xs font-medium block">Issue Date</span>
                <div className="text-gray-900">{format(new Date(quotation.issue_date), 'MMM dd, yyyy')}</div>
              </div>
              
              <div>
                <span className="text-gray-500 text-xs font-medium block">Valid Until</span>
                <div className={isExpired(quotation.valid_until) && quotation.status !== 'converted' && quotation.status !== 'accepted' ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {format(new Date(quotation.valid_until), 'MMM dd, yyyy')}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  {(quotation.status === 'accepted' || quotation.status === 'sent') && quotation.status !== 'converted' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onConvertToInvoice(quotation)}
                      className="h-8 px-3 text-xs"
                    >
                      <FileText size={12} className="mr-1" />
                      Convert
                    </Button>
                  )}
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
                      <DropdownMenuItem 
                        onClick={() => onDelete(quotation)}
                        className="text-red-600"
                      >
                        <Trash2 size={14} className="mr-2" />
                        {quotation.status === 'converted' ? 'Remove' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuotationCard;