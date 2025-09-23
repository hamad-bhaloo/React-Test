
import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, AlertTriangle, X } from 'lucide-react';

interface ImprovedPlanLimitsCheckerProps {
  type: 'clients' | 'invoices' | 'pdfs' | 'emails';
  current?: number;
  onUpgrade?: () => void;
  showProgress?: boolean;
  variant?: 'banner' | 'card';
}

const ImprovedPlanLimitsChecker = ({ 
  type, 
  current,
  onUpgrade, 
  showProgress = true,
  variant = 'card'
}: ImprovedPlanLimitsCheckerProps) => {
  const { subscribed, subscription_tier, planLimits, usageCounts, createCheckout, loading } = useSubscription();

  // Don't show any limit warnings while subscription is loading
  if (loading) {
    return null;
  }

  // Don't show warnings for premium users unless they're truly over limits
  if (subscribed && subscription_tier !== 'Free') {
    // For premium users, only show if limits are actually defined and exceeded
    const hasRealLimits = planLimits.max_clients !== 8 || planLimits.max_invoices !== 8;
    if (!hasRealLimits) {
      return null; // Still loading proper plan limits
    }
  }

  const getLimit = () => {
    switch (type) {
      case 'clients':
        return planLimits.max_clients;
      case 'invoices':
        return planLimits.max_invoices;
      case 'pdfs':
        return planLimits.max_pdfs;
      case 'emails':
        return planLimits.max_emails;
      default:
        return 0;
    }
  };

  const getCurrentUsage = () => {
    if (current !== undefined) return current;
    
    switch (type) {
      case 'clients':
        return usageCounts.clients;
      case 'invoices':
        return usageCounts.invoices;
      case 'pdfs':
        return usageCounts.pdfs;
      case 'emails':
        return usageCounts.emails;
      default:
        return 0;
    }
  };

  const limit = getLimit();
  const currentUsage = getCurrentUsage();
  const isUnlimited = limit === -1;
  const isAtLimit = !isUnlimited && currentUsage >= limit;
  const isNearLimit = !isUnlimited && currentUsage >= limit * 0.8;
  const progressPercentage = isUnlimited ? 0 : Math.min((currentUsage / limit) * 100, 100);

  const handleUpgrade = async () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      try {
        await createCheckout('Standard', 29.99);
      } catch (error) {
        console.error('Error creating checkout:', error);
      }
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'clients':
        return 'clients';
      case 'invoices':
        return 'invoices';
      case 'pdfs':
        return 'PDF downloads';
      case 'emails':
        return 'emails sent';
      default:
        return type;
    }
  };

  if (isUnlimited) {
    return null; // Don't show anything for unlimited plans
  }

  // Red banner variant for header - 50% more compact
  if (variant === 'banner' && isAtLimit) {
    return (
      <div className="bg-red-600 text-white px-3 py-1 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <div>
              <p className="font-medium text-xs">
                {subscription_tier} Plan Limit Reached
              </p>
              <p className="text-xs text-red-100">
                You've used {currentUsage}/{limit} {getTypeLabel()}. Upgrade to continue.
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Button 
              onClick={handleUpgrade}
              variant="secondary"
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 h-6 px-2 text-xs"
            >
              <Crown className="h-3 w-3 mr-1" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Card variant for inline display
  if (isAtLimit) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium text-red-800">
              Limit Reached ({currentUsage}/{limit} {getTypeLabel()})
            </p>
            <p className="text-sm text-red-600 mt-1">
              You've reached your {subscription_tier} plan limit. Upgrade to continue.
            </p>
          </div>
          <Button 
            onClick={handleUpgrade}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white ml-4 shrink-0"
          >
            <Crown className="h-3 w-3 mr-1" />
            Upgrade Plan
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isNearLimit && showProgress) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-orange-800">
              Approaching Limit ({currentUsage}/{limit} {getTypeLabel()})
            </p>
            <Button 
              onClick={handleUpgrade}
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100 shrink-0"
            >
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-orange-100"
          />
          <p className="text-xs text-orange-600 mt-1">
            {limit - currentUsage} {getTypeLabel()} remaining on your {subscription_tier} plan
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default ImprovedPlanLimitsChecker;
