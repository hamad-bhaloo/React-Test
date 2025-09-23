import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

interface AnalyticsContextType {
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackPageView: (pagePath: string, pageTitle?: string) => void;
  trackUserAction: (action: string, category: string, label?: string, value?: number) => void;
  setUserProperties: (properties: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  useEffect(() => {
    // Set user ID when user signs in
    if (user && window.gtag) {
      window.gtag('config', 'G-TRRGBT8XYK', {
        user_id: user.id,
        custom_map: {
          'user_email': user.email
        }
      });
    }
  }, [user]);

  const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        ...parameters,
        user_id: user?.id
      });
    }
  };

  const trackPageView = (pagePath: string, pageTitle?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-TRRGBT8XYK', {
        page_path: pagePath,
        page_title: pageTitle || document.title,
        user_id: user?.id
      });
    }
  };

  const trackUserAction = (action: string, category: string, label?: string, value?: number) => {
    trackEvent(action, {
      event_category: category,
      event_label: label,
      value: value
    });
  };

  const setUserProperties = (properties: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-TRRGBT8XYK', {
        custom_map: properties
      });
    }
  };

  const value = {
    trackEvent,
    trackPageView,
    trackUserAction,
    setUserProperties
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};