import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard, Bitcoin, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PublicPaymentPage = () => {
  const { paymentLinkId } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!paymentLinkId) return;

      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            clients (
              id,
              name,
              first_name,
              last_name,
              email
            ),
            invoice_items (
              id,
              product_name,
              description,
              quantity,
              rate,
              amount
            ),
            companies (
              id,
              name,
              email,
              phone,
              address
            )
          `)
          .eq('payment_link_id', paymentLinkId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast.error('Invalid payment link');
          return;
        }

        // Check if payment link has expired
        if (data.payment_link_expires_at) {
          const expiryDate = new Date(data.payment_link_expires_at);
          if (expiryDate < new Date()) {
            toast.error('This payment link has expired');
            return;
          }
        }

        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [paymentLinkId]);

  const handlePayment = async (method: string) => {
    if (!invoice) return;

    setPaying(true);
    setSelectedMethod(method);

    try {
      console.log(`Processing ${method} payment for invoice ${invoice.id}`);
      
      if (method === 'card') {
        // For card payments, we would typically integrate with Stripe or another payment processor
        // For now, we'll create a checkout session using the existing Stripe integration
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            planName: `Invoice ${invoice.invoice_number}`,
            planPrice: Number(invoice.total_amount),
            mode: 'payment', // one-time payment
            invoiceId: invoice.id
          }
        });

        if (error) throw error;

        if (data?.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
          return;
        }
      } else if (method === 'crypto') {
        // Check if Web3/MetaMask is available
        if (typeof (window as any).ethereum === 'undefined') {
          toast.error('MetaMask or Web3 wallet not found. Please install MetaMask to pay with cryptocurrency.');
          setPaying(false);
          setSelectedMethod('');
          return;
        }
        
        try {
          // For crypto payments, simulate the process
          toast.info('Redirecting to crypto payment processor...');
          // Don't record payment here - should only be recorded after actual payment confirmation
          setPaying(false);
          setSelectedMethod('');
          return;
        } catch (error: any) {
          console.error('Crypto payment error:', error);
          if (error.message?.includes('MetaMask')) {
            toast.error('Failed to connect to MetaMask. Please ensure it is installed and unlocked.');
          } else {
            toast.error('Cryptocurrency payment failed. Please try again.');
          }
          setPaying(false);
          setSelectedMethod('');
        }
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(`Payment failed: ${error.message || 'Please try again.'}`);
      setPaying(false);
      setSelectedMethod('');
    }
  };

  const processPaymentSuccess = async (method: string) => {
    try {
      // Record the payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          amount: Number(invoice.total_amount),
          payment_method: method,
          payment_date: new Date().toISOString().split('T')[0]
        });

      if (paymentError) throw paymentError;

      // Update invoice status
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          paid_amount: Number(invoice.total_amount),
          payment_status: 'paid',
          status: 'paid'
        })
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      setPaymentComplete(true);
      toast.success('Payment completed successfully!');
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    } finally {
      setPaying(false);
      setSelectedMethod('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
            <p className="text-gray-600">The payment link you're looking for doesn't exist or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">Thank you for your payment. You should receive a confirmation email shortly.</p>
            <div className="text-sm text-gray-500">
              <p>Invoice #{invoice.invoice_number}</p>
              <p>Amount: ${Number(invoice.total_amount).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientName = invoice.clients?.name || 
    `${invoice.clients?.first_name || ''} ${invoice.clients?.last_name || ''}`.trim() ||
    'Valued Customer';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Company Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.companies?.name || 'Payment Request'}
              </h1>
              <p className="text-gray-600 mt-1">Secure Payment Portal</p>
            </div>
          </CardHeader>
        </Card>

        {/* Invoice Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="font-medium">{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Issue Date</p>
                <p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className="capitalize">{invoice.payment_status}</Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Items</h3>
              <div className="space-y-2">
                {invoice.invoice_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {item.quantity} × ${Number(item.rate).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">${Number(item.amount).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-bold text-orange-600">
                  ${Number(invoice.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Choose Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => handlePayment('card')}
                disabled={paying}
                className="w-full justify-start gap-3 h-12"
                variant="outline"
              >
                <CreditCard size={18} />
                Pay with Credit/Debit Card
                {paying && selectedMethod === 'card' && (
                  <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                )}
              </Button>

              <Button
                onClick={() => handlePayment('crypto')}
                disabled={paying}
                className="w-full justify-start gap-3 h-12"
                variant="outline"
              >
                <Bitcoin size={18} />
                Pay with Cryptocurrency
                {paying && selectedMethod === 'crypto' && (
                  <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                )}
              </Button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Payment Information</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Secure SSL encrypted payment processing</li>
                <li>• Your payment information is never stored</li>
                <li>• You will receive an email confirmation after payment</li>
                <li>• For questions, contact: {invoice.companies?.email}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicPaymentPage;
