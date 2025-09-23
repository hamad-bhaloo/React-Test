
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Send, Edit, Share2, QrCode } from 'lucide-react';
import { useInvoice } from '@/hooks/useInvoices';
import { useSubscription } from '@/hooks/useSubscription';
import { downloadInvoicePDF } from '@/utils/invoiceDownload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import InvoiceViewForm from '@/components/invoices/InvoiceViewForm';
import PaymentLinkModal from '@/components/invoices/PaymentLinkModal';
import ShareInvoiceModal from '@/components/invoices/ShareInvoiceModal';
import InvoiceStatusChanger from '@/components/invoices/InvoiceStatusChanger';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import QRCodeGenerator from 'qrcode';

const ViewInvoicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading, error } = useInvoice(id!);
  const { subscription_tier } = useSubscription();
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
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

  useEffect(() => {
    if (invoice) {
      const publicLink = `${window.location.origin}/invoice/${invoice.id}`;
      QRCodeGenerator.toDataURL(publicLink, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => {
        setQrCodeDataURL(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [invoice]);

  const handleDownload = async () => {
    if (!invoice) return;
    
    setIsDownloading(true);
    try {
      const success = await downloadInvoicePDF(
        invoice,
        invoice.clients,
        invoice.invoice_items || [],
        company,
        subscription_tier || 'Free',
      );
      
      if (success) {
        toast.success('Invoice PDF downloaded successfully!');
      } else {
        toast.error('Failed to download invoice PDF');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    
    const client = invoice.clients;
    
    // Check if client has email
    if (!client?.email || client.email.trim() === '') {
      toast.error('Cannot send email: No email address provided for this client. Please add an email address to the client first.');
      return;
    }
    
    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: { invoiceId: invoice.id }
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

  // Debug logging
  console.log('ViewInvoicePage render:', { 
    id, 
    isLoading, 
    error: error?.message, 
    invoice: invoice?.id,
    user: user?.id 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Loading Invoice...</h1>
        </div>
        <div className="animate-pulse">
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Not Found</h1>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">The invoice you're looking for doesn't exist or has been removed.</p>
            <p className="text-sm text-gray-500 mt-2">Error: {error?.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const client = invoice.clients;
  const items = invoice.invoice_items || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice {invoice.invoice_number}
            </h1>
            <div className="flex gap-2 mt-2">
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status?.toUpperCase()}
              </Badge>
              <Badge className={getPaymentStatusColor(invoice.payment_status)}>
                {invoice.payment_status?.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowQRCode(true)}>
            <QrCode size={16} className="mr-2" />
            QR Code
          </Button>
          <Button variant="outline" onClick={() => setShowShareModal(true)}>
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownload}
            disabled={isDownloading}
            className="relative overflow-hidden"
          >
            <Download size={16} className={`mr-2 ${isDownloading ? 'animate-bounce' : ''}`} />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendEmail}
            disabled={isSending}
            className="relative overflow-hidden"
          >
            <Send size={16} className={`mr-2 ${isSending ? 'animate-pulse' : ''}`} />
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
          <Button onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
            <Edit size={16} className="mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Invoice Status Changer */}
      <InvoiceStatusChanger 
        invoice={invoice}
        onStatusChange={() => window.location.reload()}
      />

      {/* Invoice Content */}
      <InvoiceViewForm 
        invoice={invoice}
        client={client}
        items={items}
      />

      {/* Payment Link Modal */}
      <PaymentLinkModal
        isOpen={showPaymentLinkModal}
        onClose={() => setShowPaymentLinkModal(false)}
        invoice={invoice}
      />

      {/* Share Modal */}
      <ShareInvoiceModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        invoice={invoice}
      />

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-80">
            <CardHeader>
              <CardTitle className="text-center">Invoice QR Code</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600">Scan to view invoice publicly</p>
              {qrCodeDataURL && (
                <img 
                  src={qrCodeDataURL} 
                  alt="Invoice QR Code" 
                  className="mx-auto"
                />
              )}
              <div className="text-xs text-gray-500 break-all">
                {`${window.location.origin}/invoice/${invoice.id}`}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowQRCode(false)}
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ViewInvoicePage;
