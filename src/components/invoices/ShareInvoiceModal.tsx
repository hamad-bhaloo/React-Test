import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Copy, QrCode, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeGenerator from 'qrcode';

interface ShareInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const ShareInvoiceModal = ({ isOpen, onClose, invoice }: ShareInvoiceModalProps) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  
  const publicInvoiceLink = `${window.location.origin}/invoice/${invoice?.id}/${invoice?.payment_link_id}`;

  React.useEffect(() => {
    if (invoice && isOpen) {
      QRCodeGenerator.toDataURL(publicInvoiceLink, {
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
  }, [invoice, isOpen, publicInvoiceLink]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicInvoiceLink);
      toast.success('Invoice link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleWhatsAppShare = () => {
    const clientName = invoice?.clients?.name || invoice?.clients?.company_name || 'Dear Client';
    const message = `Hi ${clientName}! 👋

I hope this message finds you well. I'm sharing your invoice details for your review:

📄 Invoice #: ${invoice?.invoice_number}
💰 Amount: ${invoice?.currency || '$'}${invoice?.total_amount?.toFixed(2)}
📅 Due Date: ${invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}

Please click the link below to view and pay your invoice securely:
${publicInvoiceLink}

Thank you for your business! If you have any questions, please don't hesitate to reach out.

Best regards! ✨`;
    
    // Copy URL to clipboard first
    navigator.clipboard.writeText(publicInvoiceLink).then(() => {
      toast.success('Invoice link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice?.invoice_number}`,
          text: `Invoice for ${invoice?.currency || '$'}${invoice?.total_amount?.toFixed(2)}`,
          url: publicInvoiceLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      handleCopyLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Invoice</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Invoice Number:</span>
              <span className="font-semibold">{invoice?.invoice_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="font-semibold text-green-600">
                {invoice?.currency || '$'}{Number(invoice?.total_amount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Public Link */}
          <div className="space-y-2">
            <Label>Public Invoice Link</Label>
            <div className="flex gap-2">
              <Input 
                value={publicInvoiceLink} 
                readOnly 
                className="bg-gray-50"
              />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleWhatsAppShare}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            
            <Button 
              onClick={handleNativeShare}
              variant="outline"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => setShowQRCode(!showQRCode)}
              variant="outline"
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Button>
            
            <Button 
              onClick={() => window.open(publicInvoiceLink, '_blank')}
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </Button>
          </div>

          {/* QR Code Display */}
          {showQRCode && qrCodeDataURL && (
            <div className="text-center space-y-3 border-t pt-4">
              <p className="text-sm text-gray-600">Scan to view invoice</p>
              <img 
                src={qrCodeDataURL} 
                alt="Invoice QR Code" 
                className="mx-auto max-w-48"
              />
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            Anyone with this link can view the invoice
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareInvoiceModal;