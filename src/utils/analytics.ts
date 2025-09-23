// Analytics utility functions
export const ANALYTICS_EVENTS = {
  // User authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  
  // Page views
  PAGE_VIEWED: 'page_viewed',
  DASHBOARD_VIEWED: 'dashboard_viewed',
  CLIENTS_PAGE_VIEWED: 'clients_page_viewed',
  INVOICES_PAGE_VIEWED: 'invoices_page_viewed',
  SETTINGS_PAGE_VIEWED: 'settings_page_viewed',
  
  // Client actions
  CLIENT_CREATED: 'client_created',
  CLIENT_VIEWED: 'client_viewed',
  CLIENT_EDITED: 'client_edited',
  CLIENT_DELETED: 'client_deleted',
  CLIENTS_EXPORTED_CSV: 'clients_exported_csv',
  
  // Invoice actions
  INVOICE_CREATED: 'invoice_created',
  INVOICE_VIEWED: 'invoice_viewed',
  INVOICE_EDITED: 'invoice_edited',
  INVOICE_DELETED: 'invoice_deleted',
  INVOICE_SENT: 'invoice_sent',
  INVOICE_DOWNLOADED: 'invoice_downloaded',
  INVOICE_PAYMENT_RECEIVED: 'invoice_payment_received',
  INVOICES_EXPORTED_CSV: 'invoices_exported_csv',
  INVOICE_STATUS_CHANGED: 'invoice_status_changed',
  
  // Quotation actions
  QUOTATION_CREATED: 'quotation_created',
  QUOTATION_VIEWED: 'quotation_viewed',
  QUOTATION_EDITED: 'quotation_edited',
  QUOTATION_DELETED: 'quotation_deleted',
  QUOTATION_SENT: 'quotation_sent',
  QUOTATION_CONVERTED: 'quotation_converted_to_invoice',
  
  // Payment actions
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_CANCELLED: 'payment_cancelled',
  
  // Subscription and limits
  PLAN_LIMIT_REACHED: 'plan_limit_reached',
  UPGRADE_CLICKED: 'upgrade_clicked',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  
  // Features usage
  FEATURE_ACCESSED: 'feature_accessed',
  AUTOMATION_USED: 'automation_used',
  INTEGRATION_CONNECTED: 'integration_connected',
  
  // Errors and issues
  ERROR_OCCURRED: 'error_occurred',
  BUG_REPORT_SUBMITTED: 'bug_report_submitted',
  
  // Search and filters
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  
  // Export actions
  DATA_EXPORTED: 'data_exported',
  PDF_GENERATED: 'pdf_generated',
  
  // Company settings
  COMPANY_SETTINGS_UPDATED: 'company_settings_updated',
  PROFILE_UPDATED: 'profile_updated',
  
  // Team management
  TEAM_MEMBER_INVITED: 'team_member_invited',
  TEAM_MEMBER_REMOVED: 'team_member_removed',
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// Helper function to track user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      custom_map: properties
    });
  }
};

// Helper function to track errors
export const trackError = (error: Error, context?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false,
      ...context
    });
  }
};

// Helper function to track performance metrics
export const trackPerformance = (metric: string, value: number, unit: string = 'ms') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metric,
      value: value,
      event_category: 'performance'
    });
  }
};