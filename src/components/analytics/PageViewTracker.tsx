import { useEffect } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';

interface PageViewTrackerProps {
  pageName: string;
  pageData?: Record<string, any>;
}

export const PageViewTracker = ({ pageName, pageData }: PageViewTrackerProps) => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('page_view', {
      page_name: pageName,
      ...pageData,
      timestamp: new Date().toISOString()
    });
  }, [pageName, pageData, trackEvent]);

  return null;
};