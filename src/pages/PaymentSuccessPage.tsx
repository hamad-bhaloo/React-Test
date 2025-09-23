import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user } = useAuth();
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (sessionId && user?.email) {
      toast.success('Payment successful! Thank you for your payment.');
      // Auto-send receipt email
      sendReceiptEmail();
    }
  }, [sessionId, user?.email]);

  const sendReceiptEmail = async () => {
    if (!sessionId || !user?.email || emailSent) return;
    
    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-payment-receipt', {
        body: {
          sessionId,
          userEmail: user.email,
          amount: 0, // This will be updated with actual amount if needed
          planName: 'Subscription', // Default fallback
        }
      });

      if (error) {
        console.error('Error sending receipt:', error);
        toast.error('Failed to send receipt email');
      } else {
        setEmailSent(true);
        toast.success('Receipt sent to your email!');
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
      toast.error('Failed to send receipt email');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your payment has been processed successfully. Thank you for your business!
          </p>
          {sessionId && (
            <p className="text-sm text-muted-foreground">
              Session ID: {sessionId}
            </p>
          )}
          <div className="space-y-2">
            {!emailSent && (
              <Button 
                onClick={sendReceiptEmail} 
                disabled={sendingEmail}
                variant="outline"
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                {sendingEmail ? 'Sending...' : 'Send Receipt Email'}
              </Button>
            )}
            {emailSent && (
              <div className="text-sm text-green-600 text-center mb-2">
                ✓ Receipt sent to {user?.email}
              </div>
            )}
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/invoices')} 
              className="w-full"
            >
              View Invoices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;