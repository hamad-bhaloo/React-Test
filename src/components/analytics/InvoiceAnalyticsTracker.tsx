import { useEffect } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';

interface InvoiceAnalyticsTrackerProps {
  action: string;
  invoiceData?: {
    id: string;
    status: string;
    amount: number;
    client?: string;
  };
  metadata?: Record<string, any>;
}

export const InvoiceAnalyticsTracker = ({ action, invoiceData, metadata }: InvoiceAnalyticsTrackerProps) => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent(action, {
      ...invoiceData,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }, [action, invoiceData, metadata, trackEvent]);

  return null;
};