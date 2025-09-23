import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Send, 
  Eye, 
  Clock, 
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateInvoice } from '@/hooks/useInvoices';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceStatusChangerProps {
  invoice: any;
  onStatusChange?: () => void;
}

const InvoiceStatusChanger = ({ invoice, onStatusChange }: InvoiceStatusChangerProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const updateInvoiceMutation = useUpdateInvoice();

  const statusOptions = [
    {
      value: 'draft',
      label: 'Draft',
      icon: FileText,
      color: 'bg-muted text-muted-foreground',
      description: 'Invoice is being prepared',
    },
    {
      value: 'sent',
      label: 'Sent',
      icon: Send,
      color: 'bg-blue-500 text-white',
      description: 'Invoice sent to client',
    },
    {
      value: 'viewed',
      label: 'Viewed',
      icon: Eye,
      color: 'bg-purple-500 text-white',
      description: 'Client viewed the invoice',
    },
    {
      value: 'overdue',
      label: 'Overdue',
      icon: Clock,
      color: 'bg-destructive text-destructive-foreground',
      description: 'Payment is overdue',
    },
    {
      value: 'paid',
      label: 'Paid',
      icon: CheckCircle,
      color: 'bg-green-500 text-white',
      description: 'Payment completed',
    }
  ];

  const getStatusProgress = (status: string) => {
    const statusOrder = { draft: 20, sent: 40, viewed: 60, overdue: 60, paid: 100 };
    return statusOrder[status as keyof typeof statusOrder] || 0;
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === invoice.status) {
      toast.info('Invoice is already in this status');
      return;
    }

    setIsUpdating(true);
    try {
      let updateData: any = { status: newStatus };
      
      // If marking as paid, also update payment status and paid amount
      if (newStatus === 'paid') {
        updateData = {
          ...updateData,
          payment_status: 'paid',
          paid_amount: Number(invoice.total_amount)
        };

        // Record a payment for the full amount if not already paid
        if (invoice.payment_status !== 'paid') {
          await supabase
            .from('payments')
            .insert({
              invoice_id: invoice.id,
              user_id: invoice.user_id,
              amount: Number(invoice.total_amount),
              payment_method: 'manual',
              payment_date: new Date().toISOString().split('T')[0],
              notes: 'Marked as paid via status change'
            });
        }
      }

      // If marking as sent, update sent_at timestamp
      if (newStatus === 'sent') {
        updateData.sent_at = new Date().toISOString();
      }

      await updateInvoiceMutation.mutateAsync({
        id: invoice.id,
        data: updateData
      });

      toast.success(`Invoice status updated to ${newStatus}`);
      onStatusChange?.();
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      toast.error(error.message || 'Failed to update invoice status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentStatusOption = () => {
    return statusOptions.find(option => option.value === invoice.status);
  };

  const currentStatus = getCurrentStatusOption();
  const paymentPercentage = invoice.total_amount > 0 
    ? (Number(invoice.paid_amount || 0) / Number(invoice.total_amount)) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Compact Status Changer */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          {currentStatus && (
            <Badge className={`${currentStatus.color} font-medium`}>
              <currentStatus.icon className="w-3 h-3 mr-1" />
              {currentStatus.label}
            </Badge>
          )}
        </div>
        
        <Select
          value={invoice.status}
          onValueChange={handleStatusChange}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isCurrentStatus = option.value === invoice.status;
              
              return (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                    {isCurrentStatus && (
                      <Badge variant="secondary" className="text-xs ml-auto">Current</Badge>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium">{getStatusProgress(invoice.status)}%</span>
          </div>
          <Progress value={getStatusProgress(invoice.status)} className="h-2" />
        </div>
      </div>

      {/* Compact Payment Information */}
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Payment:</span>
            <Badge variant={
              invoice.payment_status === 'paid' ? 'default' : 
              invoice.payment_status === 'partial' ? 'secondary' : 'destructive'
            } className="text-xs">
              {invoice.payment_status?.toUpperCase() || 'UNPAID'}
            </Badge>
          </div>
          
          <div className="text-sm">
            <span className="font-bold text-green-600">
              {invoice.currency || 'USD'} {Number(invoice.paid_amount || 0).toFixed(2)}
            </span>
            <span className="text-muted-foreground"> / </span>
            <span className="font-medium">
              {invoice.currency || 'USD'} {Number(invoice.total_amount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{paymentPercentage.toFixed(0)}% paid</span>
          <Progress value={paymentPercentage} className="h-2 w-20" />
        </div>
      </div>
    </div>
  );
};

export default InvoiceStatusChanger;