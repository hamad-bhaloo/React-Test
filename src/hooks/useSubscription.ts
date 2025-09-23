
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
  loading: boolean;
}

interface PlanLimits {
  max_clients: number;
  max_invoices: number;
  max_pdfs: number;
  max_emails: number;
}

interface UsageCounts {
  clients: number;
  invoices: number;
  pdfs: number;
  emails: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: 'Free',
    subscription_end: null,
    loading: true,
  });
  const [planLimits, setPlanLimits] = useState<PlanLimits>({
    max_clients: 8,
    max_invoices: 8,
    max_pdfs: 8,
    max_emails: 8,
  });
  const [usageCounts, setUsageCounts] = useState<UsageCounts>({
    clients: 0,
    invoices: 0,
    pdfs: 0,
    emails: 0,
  });

  const isCheckingRef = useRef(false);
  const lastCheckRef = useRef<number>(0);

  const checkSubscription = async () => {
    if (!user?.id) {
      console.log('No user available for subscription check');
      setSubscriptionData(prev => ({ ...prev, loading: false }));
      return;
    }

    // Prevent multiple simultaneous calls
    if (isCheckingRef.current) {
      console.log('Subscription check already in progress, skipping');
      return;
    }

    // Rate limiting - only check once every 30 seconds
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) {
      console.log('Subscription check rate limited, skipping');
      return;
    }

    isCheckingRef.current = true;
    lastCheckRef.current = now;

    console.log('Checking subscription for user:', user.id);

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Subscription check error:', error);
        // Set default values on error
        setSubscriptionData({
          subscribed: false,
          subscription_tier: 'Free',
          subscription_end: null,
          loading: false,
        });
        
        // Set default plan limits for Free tier
        setPlanLimits({
          max_clients: 8,
          max_invoices: 8,
          max_pdfs: 8,
          max_emails: 8,
        });
        
        await fetchUsageCounts();
        return;
      }

      console.log('Subscription check result:', data);

      setSubscriptionData({
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || 'Free',
        subscription_end: data.subscription_end,
        loading: false,
      });

      // Fetch plan limits
      const { data: limitsData, error: limitsError } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_name', data.subscription_tier || 'Free')
        .maybeSingle();

      if (!limitsError && limitsData) {
        setPlanLimits({
          max_clients: limitsData.max_clients || 8,
          max_invoices: limitsData.max_invoices || 8,
          max_pdfs: limitsData.max_pdfs || 8,
          max_emails: limitsData.max_emails || 8,
        });
      } else {
        // Fallback to default limits if plan not found
        setPlanLimits({
          max_clients: 8,
          max_invoices: 8,
          max_pdfs: 8,
          max_emails: 8,
        });
      }

      // Fetch current usage counts
      await fetchUsageCounts();
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Set default values on error
      setSubscriptionData({
        subscribed: false,
        subscription_tier: 'Free',
        subscription_end: null,
        loading: false,
      });
      
      setPlanLimits({
        max_clients: 8,
        max_invoices: 8,
        max_pdfs: 8,
        max_emails: 8,
      });
      
      await fetchUsageCounts();
    } finally {
      isCheckingRef.current = false;
    }
  };

  const fetchUsageCounts = async () => {
    if (!user?.id) return;

    try {
      console.log('Fetching usage counts for user:', user.id);
      
      // Get current month's start date
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthStartISO = currentMonthStart.toISOString();

      // Count clients (total, not monthly)
      const { count: clientsCount, error: clientsError } = await supabase
        .from('clients')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      if (clientsError) {
        console.error('Error counting clients:', clientsError);
        return;
      }

      // Count invoices for current month
      const { count: invoicesCount, error: invoicesError } = await supabase
        .from('invoices')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', currentMonthStartISO);

      if (invoicesError) {
        console.error('Error counting invoices:', invoicesError);
        return;
      }

      // For PDFs and emails, we'll need to track these separately
      // For now, we'll use placeholder values
      const newUsageCounts = {
        clients: clientsCount || 0,
        invoices: invoicesCount || 0,
        pdfs: 0, // TODO: Implement PDF tracking
        emails: 0, // TODO: Implement email tracking
      };

      console.log('Updated usage counts:', JSON.stringify(newUsageCounts, null, 2));
      setUsageCounts(newUsageCounts);
    } catch (error) {
      console.error('Error fetching usage counts:', error);
    }
  };

  const createCheckout = async (planName: string, planPrice: number, promoCode?: string) => {
    try {
      console.log('Creating checkout for plan:', planName, 'price:', planPrice, 'promo:', promoCode);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planName, planPrice, promoCode }
      });
      
      if (error) {
        console.error('Checkout creation error:', error);
        throw error;
      }
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout session');
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      console.log('Opening customer portal');
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) {
        console.error('Customer portal error:', error);
        throw error;
      }
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open customer portal');
      throw error;
    }
  };

  const checkLimits = async (type: 'clients' | 'invoices' | 'pdfs' | 'emails') => {
    if (!user?.id) return { canCreate: false, current: 0, limit: 0 };
    
    // Don't check limits while subscription is loading to prevent false positives
    if (subscriptionData.loading) {
      return { canCreate: true, current: 0, limit: -1 };
    }

    // Also check if we're still checking subscription to prevent race conditions
    if (isCheckingRef.current) {
      return { canCreate: true, current: 0, limit: -1 };
    }

    try {
      let current = 0;
      let limitKey: keyof PlanLimits;

      switch (type) {
        case 'clients':
          current = usageCounts.clients;
          limitKey = 'max_clients';
          break;
        case 'invoices':
          current = usageCounts.invoices;
          limitKey = 'max_invoices';
          break;
        case 'pdfs':
          current = usageCounts.pdfs;
          limitKey = 'max_pdfs';
          break;
        case 'emails':
          current = usageCounts.emails;
          limitKey = 'max_emails';
          break;
        default:
          return { canCreate: true, current: 0, limit: -1 };
      }

      const limit = planLimits[limitKey];
      const canCreate = limit === -1 || current < limit;

      return { canCreate, current, limit };
    } catch (error) {
      console.error(`Error checking ${type} limits:`, error);
      return { canCreate: false, current: 0, limit: 0 };
    }
  };

  useEffect(() => {
    if (user?.id) {
      checkSubscription();
    }
  }, [user?.id]);

  // Refresh usage counts periodically (less frequently to prevent crashes)
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(() => {
        fetchUsageCounts();
      }, 300000); // Check every 5 minutes instead of every minute

      return () => clearInterval(interval);
    }
  }, [user?.id]);

  return {
    ...subscriptionData,
    planLimits,
    usageCounts,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    checkLimits,
    refreshUsage: fetchUsageCounts,
  };
};
