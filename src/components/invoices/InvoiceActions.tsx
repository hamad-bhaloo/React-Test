
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MoreHorizontal, 
  Download, 
  Mail, 
  CreditCard, 
  FileText,
  Eye,
  Edit,
  Trash2,
  Link,
  Bell,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateInvoice } from '@/hooks/useInvoices';
import { supabase } from '@/integrations/supabase/client';
import PaymentLinkModal from './PaymentLinkModal';
import { FBRSubmissionModal } from './FBRSubmissionModal';
import { downloadInvoicePDF } from '@/utils/invoiceDownload';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface InvoiceActionsProps {
  invoice: any;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const InvoiceActions = ({ invoice, onView, onEdit, onDelete }: InvoiceActionsProps) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentLink, setShowPaymentLink] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showFBRModal, setShowFBRModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Invoice ${invoice.invoice_number}`);
  const [emailMessage, setEmailMessage] = useState('');
  const queryClient = useQueryClient();
  const [reminderType, setReminderType] = useState<'gentle' | 'overdue' | 'final'>('gentle');
  const [loading, setLoading] = useState(false);
  const { subscription_tier } = useSubscription();
  const { user } = useAuth();
  const { data: company } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for fetching company');
        return null;
      }
      
      console.log('Fetching company for user:', user.id);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching company:', error);
        throw error;
      }
      
      console.log('Company data fetched:', data);
      return data;
    },
    enabled: !!user,
  });

  const updateInvoiceMutation = useUpdateInvoice();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoice.id,
        data: { status: newStatus }
      });
      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update invoice status');
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      console.log('Starting mark as paid process for invoice:', invoice.id);
      console.log('Invoice total amount:', invoice.total_amount);
      console.log('Invoice user_id:', invoice.user_id);
      
      // Record a payment for the full amount
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          amount: Number(invoice.total_amount),
          payment_method: 'manual',
          payment_date: new Date().toISOString().split('T')[0]
        });

      if (paymentError) {
        console.error('Error inserting payment:', paymentError);
        throw paymentError;
      }

      console.log('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      // Update invoice to paid status
      await updateInvoiceMutation.mutateAsync({
        id: invoice.id,
        data: { 
          paid_amount: Number(invoice.total_amount),
          payment_status: 'paid',
          status: 'paid'
        }
      });

      console.log('Invoice updated successfully');
      toast.success('Invoice marked as paid successfully');
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      toast.error(error.message || 'Failed to mark invoice as paid');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    try {
      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
          payment_date: paymentDate
        });

      if (paymentError) throw paymentError;

      // Update invoice paid amount and payment status
      const newPaidAmount = (invoice.paid_amount || 0) + parseFloat(paymentAmount);
      const totalAmount = invoice.total_amount || 0;
      
      let paymentStatus = 'unpaid';
      if (newPaidAmount >= totalAmount) {
        paymentStatus = 'paid';
      } else if (newPaidAmount > 0) {
        paymentStatus = 'partial';
      }

      await updateInvoiceMutation.mutateAsync({
        id: invoice.id,
        data: { 
          paid_amount: newPaidAmount,
          payment_status: paymentStatus,
          status: paymentStatus === 'paid' ? 'paid' : invoice.status
        }
      });

      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowPaymentModal(false);
      setPaymentAmount('');
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const success = await downloadInvoicePDF(
        invoice,
        invoice.clients,
        invoice.invoice_items || [],
        company,
        subscription_tier,
      );
      
      if (success) {
        toast.success('Invoice PDF downloaded successfully');
      } else {
        toast.error('Failed to download invoice PDF');
      }
    } catch (error) {
      console.error('Error in handleDownload:', error);
      toast.error('Failed to download invoice PDF');
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo) {
      toast.error('Please enter recipient email');
      return;
    }

    setLoading(true);
    try {
      const publicLink = `${window.location.origin}/invoice/${invoice.id}`;
      
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          to: emailTo,
          subject: emailSubject,
          message: emailMessage,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          amount: Number(invoice.total_amount || 0).toFixed(2),
          dueDate: new Date(invoice.due_date).toLocaleDateString(),
          publicLink: publicLink
        }
      });

      if (error) throw error;

      toast.success('Invoice email sent successfully!');
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!invoice.clients?.email) {
      toast.error('No email address found for this client');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-manual-reminder', {
        body: {
          invoiceId: invoice.id,
          type: reminderType
        }
      });

      if (error) throw error;

      toast.success(`${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} reminder sent successfully!`);
      setShowReminderModal(false);
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onView} className="h-8 w-8 p-0">
          <Eye size={14} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
          <Edit size={14} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleDownload}>
              <Download size={14} className="mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowPaymentLink(true)}>
              <Link size={14} className="mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setEmailTo(invoice.clients?.email || '');
              setShowEmailModal(true);
            }}>
              <Mail size={14} className="mr-2" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowPaymentModal(true)}>
              <CreditCard size={14} className="mr-2" />
              Record Payment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMarkAsPaid()}>
              <CreditCard size={14} className="mr-2" />
              Mark as Paid
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={14} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Payment Link Modal */}
      <PaymentLinkModal
        isOpen={showPaymentLink}
        onClose={() => setShowPaymentLink(false)}
        invoice={invoice}
      />

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRecordPayment}
                disabled={loading}
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emailTo">To</Label>
              <Input
                id="emailTo"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                className="w-full p-2 border rounded-md"
                rows={4}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Please find your invoice details below..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder Modal */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reminderType">Reminder Type</Label>
              <Select value={reminderType} onValueChange={(value: 'gentle' | 'overdue' | 'final') => setReminderType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gentle">Gentle Reminder</SelectItem>
                  <SelectItem value="overdue">Overdue Notice</SelectItem>
                  <SelectItem value="final">Final Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Recipient:</strong> {invoice.clients?.email || 'No email address'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Invoice:</strong> {invoice.invoice_number}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong> ${Number(invoice.total_amount || 0).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowReminderModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendReminder}
                disabled={loading || !invoice.clients?.email}
              >
                {loading ? 'Sending...' : 'Send Reminder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FBR Submission Modal */}
      <FBRSubmissionModal
        isOpen={showFBRModal}
        onClose={() => setShowFBRModal(false)}
        invoice={invoice}
        onSubmissionSuccess={() => {
          // Could refetch invoice data here if needed
        }}
      />
    </>
  );
};

export default InvoiceActions;
