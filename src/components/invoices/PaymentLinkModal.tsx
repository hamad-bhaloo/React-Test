
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Link, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const PaymentLinkModal = ({ isOpen, onClose, invoice }: PaymentLinkModalProps) => {
  const [emailTo, setEmailTo] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate secure public invoice link with payment link ID
  const publicInvoiceLink = `${window.location.origin}/invoice/${invoice?.id}/${invoice?.payment_link_id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicInvoiceLink);
      toast.success('Invoice link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          to: emailTo,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          amount: Number(invoice.total_amount || 0).toFixed(2),
          dueDate: new Date(invoice.due_date).toLocaleDateString(),
          publicLink: publicInvoiceLink
        }
      });

      if (error) throw error;

      toast.success('Invoice email sent successfully!');
      setEmailTo('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const clientName = invoice?.clients?.name || invoice?.clients?.company_name || 'Dear Client';
    const message = `Hi ${clientName}! 👋

I hope this message finds you well. I'm sharing your invoice details for your review:

📄 Invoice #: ${invoice?.invoice_number}
💰 Amount: ${(invoice?.currency || '$')}${Number(invoice?.total_amount || 0).toFixed(2)}
📅 Due Date: ${invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}

Please click the link below to view and pay your invoice securely:
${publicInvoiceLink}

Thank you for your business! If you have any questions, please don't hesitate to reach out.

Best regards! ✨`;

    navigator.clipboard.writeText(publicInvoiceLink)
      .then(() => toast.success('Invoice link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoice Public Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Invoice #{invoice?.invoice_number}</div>
            <div className="font-bold text-lg">${Number(invoice?.total_amount || 0).toFixed(2)}</div>
          </div>

          {/* Public Invoice Link */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <Label className="text-sm text-gray-600">Public Invoice Link</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={publicInvoiceLink}
                readOnly
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                <Copy size={14} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This link allows customers to view and pay the invoice
            </p>
          </div>

          {/* Email Section */}
          <div className="border-t pt-4">
            <Label htmlFor="email">Send link via email</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={handleSendEmail}
                disabled={loading}
              >
                <Mail size={16} />
              </Button>
            </div>
          </div>

          {/* Share via WhatsApp */}
          <div className="border-t pt-4">
            <Button variant="secondary" onClick={handleWhatsAppShare}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Share on WhatsApp
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            <strong>Note:</strong> Customers can pay using credit cards or cryptocurrency through this secure link.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkModal;
