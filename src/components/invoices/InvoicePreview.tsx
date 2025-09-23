import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Send, Eye } from 'lucide-react';
import { useInvoice } from '@/hooks/useInvoices';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import InvoiceViewForm from './InvoiceViewForm';
import { downloadInvoicePDF } from '@/utils/invoiceDownload';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface InvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
}

const InvoicePreview = ({ isOpen, onClose, invoiceId }: InvoicePreviewProps) => {
  console.log('=== InvoicePreview Debug Info ===');
  console.log('InvoicePreview rendered with:', { isOpen, invoiceId });
  console.log('Invoice ID type:', typeof invoiceId);
  console.log('Invoice ID length:', invoiceId?.length);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Use the useInvoice hook to get the specific invoice
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
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
  
  console.log('=== Hook Response Debug ===');
  console.log('InvoicePreview - invoice data:', invoice);
  console.log('InvoicePreview - loading state:', isLoading);
  console.log('InvoicePreview - error state:', error);
  console.log('InvoicePreview - hook enabled?', !!invoiceId);
  
  if (!isOpen) {
    console.log('InvoicePreview - Dialog not open, returning null');
    return null;
  }

  if (isLoading) {
    console.log('InvoicePreview - Still loading, showing spinner');
    console.log('Loading details:', { invoiceId, isLoading, hasError: !!error });
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Invoice... (ID: {invoiceId})</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <div className="ml-4">
              <span>Loading invoice data...</span>
              <p className="text-sm text-gray-500 mt-2">Invoice ID: {invoiceId}</p>
              <p className="text-sm text-gray-500">Loading: {isLoading ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    console.error('=== InvoicePreview Error Details ===');
    console.error('InvoicePreview error:', error);
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Loading Invoice</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-4">Failed to load invoice. Please try again.</p>
              <p className="text-sm text-gray-500">Error: {error.message}</p>
              <p className="text-sm text-gray-500">Invoice ID: {invoiceId}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    console.log('=== Invoice Not Found Debug ===');
    console.log('InvoicePreview - invoice not found');
    console.log('Searched for ID:', invoiceId);
    console.log('Hook returned:', { invoice, isLoading, error });
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Not Found</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-gray-500 mb-4">Invoice not found or may have been deleted.</p>
              <p className="text-sm text-gray-400">Looking for ID: {invoiceId}</p>
              <p className="text-sm text-gray-400">Loading state: {isLoading ? 'true' : 'false'}</p>
              <p className="text-sm text-gray-400">Has error: {error ? 'true' : 'false'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const client = invoice.clients;
  const items = invoice.invoice_items || [];
  const templateId = invoice.template_id || 1;

  console.log('=== Successful Invoice Load ===');
  console.log('InvoicePreview - rendering with data:', { 
    invoiceNumber: invoice.invoice_number,
    clientName: client?.name || client?.first_name,
    itemsCount: items.length,
    templateId 
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      console.log('Starting PDF download with template:', templateId);
      
      const success = await downloadInvoicePDF(
        invoice,
        client,
        items,
        company,
        subscription_tier
      );
      
      if (success) {
        console.log('Invoice PDF downloaded successfully');
        toast.success('Invoice PDF downloaded successfully!');
      } else {
        console.error('Failed to download invoice PDF');
        toast.error('Failed to download invoice PDF');
      }
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      toast.error('Failed to download invoice PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    
    // Check if client has email
    if (!client?.email || client.email.trim() === '') {
      toast.error('Cannot send email: No email address provided for this client. Please add an email address to the client first.');
      return;
    }
    
    setIsSending(true);
    try {
      const publicLink = `${window.location.origin}/invoice/${invoice.id}`;
      
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          to: client.email,
          subject: `Invoice ${invoice.invoice_number} - Payment Required`,
          message: 'Please find your invoice details below.',
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          amount: Number(invoice.total_amount || 0).toFixed(2),
          dueDate: new Date(invoice.due_date).toLocaleDateString(),
          publicLink: publicLink
        }
      });

      if (error) {
        throw error;
      }

      // Update invoice status to sent
      await supabase
        .from('invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', invoice.id);

      toast.success(`Invoice sent successfully to ${client.email}!`);
    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      toast.error(error.message || 'Failed to send invoice email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Preview - {invoice.invoice_number} (Template {templateId})</DialogTitle>
        </DialogHeader>

        <div className="min-h-[600px]">
          <InvoiceViewForm 
            invoice={invoice}
            client={client}
            items={items}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4 pt-8 border-t">
          <Button 
            variant="outline" 
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download size={16} className={`mr-2 ${isDownloading ? 'animate-bounce' : ''}`} />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendEmail}
            disabled={isSending}
          >
            <Send size={16} className={`mr-2 ${isSending ? 'animate-pulse' : ''}`} />
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
          <Button>
            <Eye size={16} className="mr-2" />
            Mark as Viewed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreview;
