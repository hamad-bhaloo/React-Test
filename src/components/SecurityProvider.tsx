import React, { createContext, useContext, useEffect, useState } from 'react';
import { detectBot, rateLimiter } from '@/utils/security';

interface SecurityContextType {
  isBot: boolean;
  checkRateLimit: (key: string, maxRequests?: number, windowMs?: number) => boolean;
  reportSecurityEvent: (event: string, details?: any) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  const [isBot, setIsBot] = useState(false);

  useEffect(() => {
    // Detect bots on mount
    setIsBot(detectBot());

    // Security event listeners
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Re-check for suspicious activity when page becomes visible
        setIsBot(detectBot());
      }
    };

    const handleBeforeUnload = () => {
      // Clear sensitive data before page unload
      if (typeof window !== 'undefined') {
        // Clear any temporary sensitive data
        sessionStorage.removeItem('temp_data');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const checkRateLimit = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
    return rateLimiter.isAllowed(key, maxRequests, windowMs);
  };

  const reportSecurityEvent = (event: string, details?: any) => {
    console.warn(`Security Event: ${event}`, details);
    // In production, you would send this to your security monitoring service
  };

  const value = {
    isBot,
    checkRateLimit,
    reportSecurityEvent,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};
