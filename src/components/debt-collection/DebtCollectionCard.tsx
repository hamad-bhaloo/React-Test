import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Edit, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Clock,
  User,
  Building
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { DebtCollectionDetailsModal } from './DebtCollectionDetailsModal';

interface DebtCollectionCardProps {
  debtCollection: any;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export const DebtCollectionCard = ({ 
  debtCollection, 
  getStatusColor, 
  getPriorityColor 
}: DebtCollectionCardProps) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();
  
  const invoice = debtCollection.invoices;
  const client = invoice?.clients;
  
  const daysOverdue = differenceInDays(new Date(), new Date(invoice?.due_date));
  const outstandingAmount = Math.max(0, (invoice?.total_amount || 0) - (invoice?.paid_amount || 0));
  const isClosed = debtCollection.status === 'closed' || debtCollection.status === 'settled' || debtCollection.status === 'written_off';

  // Compact view for closed cases
  if (isClosed) {
    return (
      <>
        <Card className="hover:shadow-sm transition-shadow bg-muted/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">#{invoice?.invoice_number}</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {debtCollection.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {client?.company ? (
                    <>
                      <Building className="h-3 w-3" />
                      <span className="truncate max-w-32">{client.company}</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-32">{client?.name}</span>
                    </>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-green-600">${(debtCollection.amount_collected || 0).toFixed(2)}</span> collected
                </div>
                
                {debtCollection.settlement_date && (
                  <div className="text-xs text-muted-foreground">
                    Closed: {format(new Date(debtCollection.settlement_date), 'MMM dd, yyyy')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDetailsModal(true)}
                  className="h-8 px-2 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Details
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/invoices/view/${invoice?.id}`)}
                  className="h-8 px-2 text-xs"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DebtCollectionDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          debtCollectionId={debtCollection.id}
        />
      </>
    );
  }

  // Full view for active cases
  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                Invoice #{invoice?.invoice_number}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {client?.company ? (
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{client.company}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{client?.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(debtCollection.status)}>
                {debtCollection.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className={getPriorityColor(debtCollection.priority)}>
                {debtCollection.priority.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 pt-0">
          {/* Amount Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="font-semibold text-red-600">${outstandingAmount.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="font-semibold text-green-600">${(debtCollection.amount_collected || 0).toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Days Overdue</p>
              <p className="font-semibold text-orange-600">{daysOverdue} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Contact Attempts</p>
              <p className="font-semibold">{debtCollection.contact_attempts || 0}</p>
            </div>
          </div>

          {/* Timeline Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p>{format(new Date(invoice?.due_date), 'MMM dd, yyyy')}</p>
              </div>
            </div>
            {debtCollection.last_contact_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Contact</p>
                  <p>{format(new Date(debtCollection.last_contact_date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            )}
            {debtCollection.next_action_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Next Action</p>
                  <p>{format(new Date(debtCollection.next_action_date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetailsModal(true)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>
            
            {client?.phone && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`tel:${client.phone}`, '_self')}
                className="flex items-center gap-1"
              >
                <Phone className="h-4 w-4" />
                Call
              </Button>
            )}
            
            {client?.email && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`mailto:${client.email}`, '_self')}
                className="flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/invoices/view/${invoice?.id}`)}
              className="flex items-center gap-1"
            >
              <DollarSign className="h-4 w-4" />
              View Invoice
            </Button>
          </div>

          {debtCollection.collection_notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{debtCollection.collection_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DebtCollectionDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        debtCollectionId={debtCollection.id}
      />
    </>
  );
};