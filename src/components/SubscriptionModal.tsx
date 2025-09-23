
import React from 'react';
import { X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionPlans from '@/components/subscription/SubscriptionPlans';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
  const { subscription_tier, loading } = useSubscription();

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Subscription Plans</h3>
            <p className="text-gray-600">Please wait while we fetch your current subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="text-gray-600 mt-1">
              Current Plan: <span className="font-semibold text-orange-600">{subscription_tier}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <SubscriptionPlans showManageButton={false} />
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              All plans include secure payment processing and can be cancelled anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
