import React, { useState } from 'react';
import { Crown, Check, Star, Shield, Zap, RefreshCw } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  promoCode?: string;
  showManageButton?: boolean;
  onManageSubscription?: () => void;
}

const SubscriptionPlans = ({ promoCode = '', showManageButton = true, onManageSubscription }: SubscriptionPlansProps) => {
  const { 
    subscription_tier, 
    createCheckout, 
    openCustomerPortal, 
    subscribed,
    loading 
  } = useSubscription();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const plans = [
    {
      name: 'Free',
      price: 0,
      originalPrice: 0,
      icon: Shield,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      features: ['8 Clients', '8 Invoices', '8 PDF Downloads', '8 Email Sends'],
      limits: { clients: 8, invoices: 8, pdfs: 8, emails: 8 }
    },
    {
      name: 'Basic',
      price: 4.99,
      originalPrice: 9.99,
      icon: Star,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      features: ['15 Clients', '30 Invoices', '30 PDF Downloads', '30 Email Sends', 'Email Support'],
      limits: { clients: 15, invoices: 30, pdfs: 30, emails: 30 }
    },
    {
      name: 'Standard',
      price: 14.99,
      originalPrice: 29.99,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      popular: true,
      features: ['200 Clients', '100 Invoices', '200 PDF Downloads', '200 Email Sends', 'Priority Support', 'Custom Templates'],
      limits: { clients: 200, invoices: 100, pdfs: 200, emails: 200 }
    },
    {
      name: 'Premium',
      price: 24.99,
      originalPrice: 49.99,
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      features: ['Unlimited Clients', 'Unlimited Invoices', 'Unlimited PDF Downloads', 'Unlimited Email Sends', '24/7 Support', 'Advanced Analytics', 'API Access'],
      limits: { clients: -1, invoices: -1, pdfs: -1, emails: -1 }
    }
  ];

  const handlePlanSelect = async (planName: string, planPrice: number) => {
    if (planName === 'Free') {
      toast.info('You are already on the Free plan');
      return;
    }

    if (subscription_tier === planName) {
      toast.info(`You are already subscribed to the ${planName} plan`);
      return;
    }

    setActionLoading(planName);
    try {
      await createCheckout(planName, planPrice, promoCode);
      toast.success('Redirecting to checkout...');
    } catch (error) {
      toast.error('Failed to create checkout session');
      console.error('Checkout error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading('manage');
    try {
      if (onManageSubscription) {
        onManageSubscription();
      } else {
        await openCustomerPortal();
        toast.success('Opening customer portal...');
      }
    } catch (error) {
      toast.error('Failed to open customer portal');
      console.error('Portal error:', error);
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
      {plans.map((plan) => {
        const Icon = plan.icon;
        const isCurrentPlan = subscription_tier === plan.name;

        return (
          <Card
            key={plan.name}
            className={`relative p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
              plan.popular 
                ? 'bg-gradient-to-br from-primary/10 via-background to-background border-primary shadow-lg' 
                 : isCurrentPlan 
                   ? 'bg-gradient-to-br from-green-500/10 via-background to-background border-green-500' 
                   : 'bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50'
               } ${plan.popular || isCurrentPlan || plan.price > 0 ? 'mt-4' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
                  🔥 50% OFF - LIMITED TIME!
                </span>
              </div>
            )}

            {plan.price > 0 && !plan.popular && (
              <div className="absolute -top-3 left-4 z-10">
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  50% OFF
                </span>
              </div>
            )}
            
            {isCurrentPlan && (
              <div className="absolute -top-3 right-4 z-10">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <Icon className={`w-8 h-8 ${plan.color} mx-auto mb-3`} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                {plan.price > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg text-gray-500 line-through">
                        ${plan.originalPrice}
                      </span>
                      <span className="text-3xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                    </div>
                    <span className="text-gray-600 text-sm">/month</span>
                    <div className="text-green-600 text-sm font-semibold">
                      Save ${(plan.originalPrice - plan.price).toFixed(2)}/month
                    </div>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                )}
              </div>
            </div>

           <ul className="space-y-3 mb-6">
             {plan.features.map((feature, index) => (
               <li key={index} className="flex items-center">
                 <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                 <span className="text-sm text-gray-700">{feature}</span>
               </li>
             ))}
           </ul>

           <div className="mt-auto">
             {isCurrentPlan ? (
               <div className="space-y-2">
                 <button
                   disabled
                   className="w-full py-3 px-4 bg-green-500 text-white rounded-lg font-medium cursor-not-allowed"
                 >
                   Current Plan
                 </button>
                 {subscribed && plan.name !== 'Free' && showManageButton && (
                   <Button
                     onClick={handleManageSubscription}
                     disabled={actionLoading === 'manage'}
                     variant="outline"
                     className="w-full"
                   >
                     {actionLoading === 'manage' ? (
                       <RefreshCw size={16} className="animate-spin mr-2" />
                     ) : null}
                     {actionLoading === 'manage' ? 'Loading...' : 'Manage Subscription'}
                   </Button>
                 )}
               </div>
             ) : (
               <button
                 onClick={() => handlePlanSelect(plan.name, plan.price)}
                 disabled={actionLoading === plan.name}
                 className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                   plan.popular
                     ? 'bg-orange-500 hover:bg-orange-600 text-white'
                     : 'bg-gray-900 hover:bg-gray-800 text-white'
                 }`}
               >
                 {actionLoading === plan.name ? 'Processing...' : 
                  plan.name === 'Free' ? 'Current Plan' : `Upgrade to ${plan.name}`}
               </button>
             )}
           </div>
         </Card>
        );
      })}
    </div>
  );
};

export default SubscriptionPlans;