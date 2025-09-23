
import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanLimitsCheckerProps {
  type: 'clients' | 'invoices' | 'pdfs' | 'emails';
  onUpgrade: () => void;
  children: React.ReactNode;
}

const PlanLimitsChecker = ({ type, onUpgrade, children }: PlanLimitsCheckerProps) => {
  const { checkLimits, usageCounts, planLimits, loading } = useSubscription();
  const [limits, setLimits] = React.useState({ canCreate: true, current: 0, limit: 0 });
  const [isChecking, setIsChecking] = React.useState(false);

  React.useEffect(() => {
    const checkCurrentLimits = async () => {
      if (loading) return; // Don't check while subscription is loading
      
      setIsChecking(true);
      try {
        const result = await checkLimits(type);
        setLimits(result);
      } catch (error) {
        console.error('Error checking limits in PlanLimitsChecker:', error);
        // Default to allowing creation on error
        setLimits({ canCreate: true, current: 0, limit: -1 });
      } finally {
        setIsChecking(false);
      }
    };
    checkCurrentLimits();
  }, [type, checkLimits, usageCounts, planLimits, loading]);

  // If subscription is loading, don't show any limit checks to avoid flickering
  if (loading) {
    return <>{children}</>;
  }

  // If we're checking limits or can create, render children normally
  if (isChecking || limits.canCreate) {
    return <>{children}</>;
  }

  // If cannot create, show disabled state with upgrade overlay
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg backdrop-blur-sm">
        <div className="text-center p-4">
          <Crown className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            {type.charAt(0).toUpperCase() + type.slice(1)} Limit Reached
          </p>
          <p className="text-xs text-gray-600 mb-3">
            {limits.current}/{limits.limit === -1 ? '∞' : limits.limit} used this month
          </p>
          <Button
            onClick={onUpgrade}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlanLimitsChecker;
