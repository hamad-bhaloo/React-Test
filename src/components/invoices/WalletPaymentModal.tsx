
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard, Bitcoin } from 'lucide-react';
import { useWallet, useAddFunds, usePayInvoiceWithWallet } from '@/hooks/useWallet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface WalletPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const WalletPaymentModal = ({ isOpen, onClose, invoice }: WalletPaymentModalProps) => {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const addFundsMutation = useAddFunds();
  const payInvoiceMutation = usePayInvoiceWithWallet();
  const queryClient = useQueryClient();
  
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processingPayment, setProcessingPayment] = useState('');

  const invoiceAmount = Number(invoice?.total_amount || 0);
  const walletBalance = Number(wallet?.balance || 0);
  const hasSufficient = walletBalance >= invoiceAmount;

  const handleAddFunds = async () => {
    const amount = parseFloat(addFundsAmount);
    if (!amount || amount <= 0) return;

    try {
      await addFundsMutation.mutateAsync({ amount, method: paymentMethod });
      setShowAddFunds(false);
      setAddFundsAmount('');
    } catch (error) {
      console.error('Error adding funds:', error);
    }
  };

  const handlePayWithWallet = async () => {
    if (!hasSufficient) {
      setShowAddFunds(true);
      return;
    }

    try {
      await payInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        amount: invoiceAmount
      });
      onClose();
    } catch (error) {
      console.error('Error paying with wallet:', error);
    }
  };

  const handlePayWithMethod = async (method: string) => {
    setProcessingPayment(method);
    
    try {
      console.log(`Processing ${method} payment for invoice ${invoice.id}`);
      
      if (method === 'card') {
        // Integrate with Stripe for card payments
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            planName: `Invoice ${invoice.invoice_number}`,
            planPrice: invoiceAmount,
            mode: 'payment', // one-time payment
            invoiceId: invoice.id
          }
        });

        if (error) throw error;

        if (data?.url) {
          // Open Stripe checkout in a new tab
          window.open(data.url, '_blank');
          onClose();
          return;
        }
      } else if (method === 'crypto') {
        // Check if Web3/MetaMask is available
        if (typeof (window as any).ethereum === 'undefined') {
          toast.error('MetaMask or Web3 wallet not found. Please install MetaMask to pay with cryptocurrency.');
          setProcessingPayment(null);
          return;
        }
        
        try {
          // Simulate crypto payment processing
          toast.info('Redirecting to crypto payment processor...');
          // Don't record payment here - should only be recorded after actual payment confirmation
          onClose();
        } catch (error: any) {
          console.error('Crypto payment error:', error);
          if (error.message?.includes('MetaMask')) {
            toast.error('Failed to connect to MetaMask. Please ensure it is installed and unlocked.');
          } else {
            toast.error('Cryptocurrency payment failed. Please try again.');
          }
          setProcessingPayment(null);
        }
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(`Payment failed: ${error.message || 'Please try again.'}`);
    } finally {
      setProcessingPayment('');
    }
  };

  const processExternalPayment = async (method: string) => {
    try {
      // Record the payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          amount: invoiceAmount,
          payment_method: method,
          payment_date: new Date().toISOString().split('T')[0]
        });

      if (paymentError) throw paymentError;

      // Update invoice status
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          paid_amount: invoiceAmount,
          payment_status: 'paid',
          status: 'paid'
        })
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      toast.success('Payment completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  };

  if (walletLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Invoice #{invoice?.invoice_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount Due:</span>
              <span className="font-bold text-lg">${invoiceAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={20} className="text-orange-500" />
              <h3 className="font-medium">Wallet Balance</h3>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">${walletBalance.toFixed(2)}</span>
              <Badge variant={hasSufficient ? "default" : "destructive"}>
                {hasSufficient ? "Sufficient" : "Insufficient"}
              </Badge>
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-3">
            <h3 className="font-medium">Payment Methods</h3>
            
            {/* Wallet Payment */}
            <Button
              onClick={handlePayWithWallet}
              disabled={payInvoiceMutation.isPending}
              className="w-full justify-start gap-3 h-12"
              variant={hasSufficient ? "default" : "outline"}
            >
              <Wallet size={18} />
              {hasSufficient ? "Pay with Wallet" : "Add Funds & Pay"}
              {payInvoiceMutation.isPending && (
                <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
            </Button>

            {/* Card Payment */}
            <Button
              onClick={() => handlePayWithMethod('card')}
              disabled={processingPayment === 'card'}
              variant="outline"
              className="w-full justify-start gap-3 h-12"
            >
              <CreditCard size={18} />
              Pay with Card
              {processingPayment === 'card' && (
                <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              )}
            </Button>

            {/* Crypto Payment */}
            <Button
              onClick={() => handlePayWithMethod('crypto')}
              disabled={processingPayment === 'crypto'}
              variant="outline"
              className="w-full justify-start gap-3 h-12"
            >
              <Bitcoin size={18} />
              Pay with Crypto
              {processingPayment === 'crypto' && (
                <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              )}
            </Button>
          </div>

          {/* Add Funds Modal */}
          {showAddFunds && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Add Funds to Wallet</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    placeholder={`At least $${(invoiceAmount - walletBalance).toFixed(2)}`}
                  />
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddFunds(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddFunds}
                    disabled={addFundsMutation.isPending}
                    className="flex-1"
                  >
                    {addFundsMutation.isPending ? 'Adding...' : 'Add Funds'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletPaymentModal;
