
import React, { useState } from 'react';
import { Crown, ArrowRight, RefreshCw, CreditCard, Tag } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import SubscriptionPlans from '@/components/subscription/SubscriptionPlans';

const SubscriptionPage = () => {
  const { 
    subscribed, 
    subscription_tier, 
    subscription_end, 
    loading, 
    planLimits,
    createCheckout, 
    openCustomerPortal,
    checkSubscription 
  } = useSubscription();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);



  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setPromoLoading(true);
    try {
      // Simple validation for the demo promo codes
      const validCodes = ['FREEBASIC2024', 'FREESTANDARD2024', 'FREEPREMIUM2024'];
      if (validCodes.includes(promoCode.toUpperCase())) {
        toast.success('Promo code is valid! 100% discount applied.');
      } else {
        toast.error('Invalid promo code');
      }
    } catch (error) {
      toast.error('Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading('manage');
    try {
      await openCustomerPortal();
      toast.success('Opening customer portal...');
    } catch (error) {
      toast.error('Failed to open customer portal');
      console.error('Portal error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefreshSubscription = async () => {
    setActionLoading('refresh');
    try {
      await checkSubscription();
      toast.success('Subscription status updated');
    } catch (error) {
      toast.error('Failed to refresh subscription status');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header matching Client page style */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Crown size={24} className="text-primary" />
            Subscription Management
          </h1>
          <p className="text-sm text-slate-600">Manage your subscription and billing preferences</p>
        </div>
        
        <Button 
          onClick={handleRefreshSubscription}
          variant="outline"
          size="sm"
          disabled={actionLoading === 'refresh'}
          className="h-9"
        >
          <RefreshCw size={16} className={`mr-2 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Current Subscription Status */}
      <Card className="bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10">
              <CreditCard size={18} className="text-primary" />
            </div>
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={subscribed ? "default" : "secondary"}>
                  {subscription_tier}
                </Badge>
                {subscribed && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Active
                  </Badge>
                )}
              </div>
              {subscription_end && (
                <p className="text-sm text-gray-600">
                  {subscribed ? 'Renews' : 'Expired'} on: {new Date(subscription_end).toLocaleDateString()}
                </p>
              )}
              <div className="mt-2 text-sm text-gray-600">
                <p>Current Usage Limits:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Clients: {planLimits.max_clients === -1 ? 'Unlimited' : planLimits.max_clients}</li>
                  <li>Invoices: {planLimits.max_invoices === -1 ? 'Unlimited' : planLimits.max_invoices}</li>
                  <li>PDF Downloads: {planLimits.max_pdfs === -1 ? 'Unlimited' : planLimits.max_pdfs}</li>
                  <li>Email Sends: {planLimits.max_emails === -1 ? 'Unlimited' : planLimits.max_emails}</li>
                </ul>
              </div>
            </div>
            {subscribed && subscription_tier !== 'Free' && (
              <Button
                onClick={handleManageSubscription}
                disabled={actionLoading === 'manage'}
                className="flex items-center gap-2"
              >
                {actionLoading === 'manage' ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promo Code Section */}
      <Card className="bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-green-500/20 to-green-500/10">
              <Tag size={18} className="text-green-500" />
            </div>
            Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter promo code (e.g., FREEBASIC2024)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 bg-background/50 border-border/50 focus:bg-background"
            />
            <Button 
              onClick={validatePromoCode}
              disabled={promoLoading}
              variant="outline"
              className="bg-background/50 border-border/50 hover:bg-background/70"
            >
              {promoLoading ? 'Validating...' : 'Validate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Available Plans</h2>
        <SubscriptionPlans 
          promoCode={promoCode} 
          onManageSubscription={handleManageSubscription}
        />
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm">
          All plans include secure payment processing and can be cancelled anytime.
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Need help? Contact our support team for assistance with your subscription.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
