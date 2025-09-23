import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeGenerator from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  paymentLinkId: string;
}

export const CryptoPaymentModal: React.FC<CryptoPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  paymentLinkId
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [copied, setCopied] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-crypto-payment', {
        body: {
          invoiceId: invoice.id,
          paymentLinkId: paymentLinkId
        }
      });

      if (error) {
        toast.error(error.message || 'Failed to create crypto payment');
        return;
      }

      setPaymentData(data);

      // Generate QR code for the payment address
      if (data.pay_address) {
        // Use just the address for maximum wallet compatibility
        // Most wallets including MetaMask and RedotPay prefer plain addresses
        const qrCodeData = await QRCodeGenerator.toDataURL(data.pay_address, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        setQrCode(qrCodeData);
      }

    } catch (error) {
      console.error('Error creating crypto payment:', error);
      toast.error('Failed to create crypto payment');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(`${type} copied to clipboard!`);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleClose = () => {
    setPaymentData(null);
    setQrCode('');
    setCopied('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-orange-100">
              <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 1.858-1.135 2.022-2.568 1.651l-.556 2.228-1.261-.315.544-2.178c-.331-.083-.673-.167-1.013-.248l-.547 2.191-1.26-.314.556-2.228c-.275-.067-.546-.132-.807-.196l-1.736-.434.335-1.378s.942.225.926.208c.513.128.642-.295.723-.465L9.78 3.887c.021-.125-.04-.309-.31-.382.017.016-.925-.232-.925-.232L8.16 1.987l1.833.458c.342.085.677.174 1.007.26l.555-2.226L12.818.793l-.555 2.218c.332.076.658.155.975.237l.551-2.207 1.26.315-.556 2.228c1.664.472 2.689 1.446 2.507 2.729-.146.901-.777 1.421-1.704 1.561.766.481 1.006 1.325.732 2.236zm-1.308-3.585c-.301-2.014-2.201-1.742-2.82-1.583l-.712 2.855c.619.154 2.599.459 3.532-1.272zm-.428 3.606c-.336-2.225-2.469-1.934-3.158-1.762l-.778 3.121c.689.172 2.91.492 3.936-1.359z"/>
              </svg>
            </div>
            Pay with Cryptocurrency
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!paymentData ? (
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-100">
                <div className="space-y-3">
                  <div className="text-lg font-semibold text-gray-900">
                    Invoice #{invoice.invoice_number}
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    ${Number(invoice.total_amount).toFixed(2)} {invoice.currency || 'USD'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Pay securely with Bitcoin or other cryptocurrencies
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreatePayment}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  'Generate Crypto Payment'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Payment Created Successfully</h3>
                <p className="text-sm text-green-700">
                  Send the exact amount below to the provided address to complete payment.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Amount to Send
                  </label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <span className="font-mono text-lg font-semibold text-gray-900">
                      {paymentData.pay_amount} {paymentData.pay_currency?.toUpperCase()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(paymentData.pay_amount, 'Amount')}
                    >
                      {copied === 'Amount' ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Payment Address
                  </label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <span className="font-mono text-sm text-gray-900 truncate mr-2">
                      {paymentData.pay_address}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(paymentData.pay_address, 'Address')}
                    >
                      {copied === 'Address' ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>

                {qrCode && (
                  <div className="text-center">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      QR Code
                    </label>
                    <div className="inline-block p-3 bg-white border border-gray-200 rounded-lg">
                      <img src={qrCode} alt="Payment QR Code" className="w-32 h-32" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Scan with your crypto wallet
                    </p>
                  </div>
                )}

                {paymentData.payment_url && (
                  <Button 
                    onClick={() => window.open(paymentData.payment_url, '_blank')}
                    className="w-full"
                    variant="outline"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Wallet
                  </Button>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Send the exact amount shown above</li>
                    <li>• Payment confirmation may take 10-30 minutes</li>
                    <li>• Invoice status will update automatically once confirmed</li>
                    <li>• Do not close this page until payment is sent</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Close
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Check Payment Status
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoPaymentModal;