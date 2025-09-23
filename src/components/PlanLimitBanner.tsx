
import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import ImprovedPlanLimitsChecker from './ImprovedPlanLimitsChecker';

const PlanLimitBanner = () => {
  const { usageCounts, planLimits, loading, subscribed, subscription_tier } = useSubscription();

  // Don't show any banners while subscription is loading or still checking
  if (loading) {
    return null;
  }

  // Don't show banners for premium users unless they're truly over limits
  if (subscribed && subscription_tier !== 'Free') {
    // For premium users, only show if limits are actually defined and exceeded
    const hasRealLimits = planLimits.max_clients !== 8 || planLimits.max_invoices !== 8;
    if (!hasRealLimits) {
      return null; // Still loading proper plan limits
    }
  }

  // Check if any limit is reached
  const isClientLimitReached = planLimits.max_clients !== -1 && usageCounts.clients >= planLimits.max_clients;
  const isInvoiceLimitReached = planLimits.max_invoices !== -1 && usageCounts.invoices >= planLimits.max_invoices;
  const isPdfLimitReached = planLimits.max_pdfs !== -1 && usageCounts.pdfs >= planLimits.max_pdfs;
  const isEmailLimitReached = planLimits.max_emails !== -1 && usageCounts.emails >= planLimits.max_emails;

  // Show banner for the first limit that's reached
  if (isClientLimitReached) {
    return <ImprovedPlanLimitsChecker type="clients" variant="banner" />;
  }
  
  if (isInvoiceLimitReached) {
    return <ImprovedPlanLimitsChecker type="invoices" variant="banner" />;
  }
  
  if (isPdfLimitReached) {
    return <ImprovedPlanLimitsChecker type="pdfs" variant="banner" />;
  }
  
  if (isEmailLimitReached) {
    return <ImprovedPlanLimitsChecker type="emails" variant="banner" />;
  }

  return null;
};

export default PlanLimitBanner;
