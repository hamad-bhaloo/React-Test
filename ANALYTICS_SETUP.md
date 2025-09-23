# Google Analytics Implementation Guide

## Setup Instructions

### 1. Replace GA_MEASUREMENT_ID
Replace `GA_MEASUREMENT_ID` in the following files with your actual Google Analytics 4 measurement ID:
- `index.html` (lines 22 and 26)
- `src/contexts/AnalyticsContext.tsx` (lines 36, 49, and 72)

Your measurement ID should look like: `G-XXXXXXXXXX`

### 2. Analytics Features Implemented

#### Page Tracking
- Automatic page view tracking on route changes
- Custom page tracking with metadata

#### User Journey Tracking
- User sign up/sign in events
- User authentication state changes
- Session management

#### Business Actions Tracking
**Invoices:**
- Invoice creation, editing, viewing, deletion
- Invoice status changes
- Invoice exports (CSV)
- Payment events

**Clients:**
- Client creation, editing, viewing, deletion
- Client exports (CSV)

**Payments:**
- Payment initiation, completion, failure, cancellation

#### Error Tracking
- JavaScript errors and exceptions
- Performance metrics tracking

### 3. Available Analytics Functions

```typescript
import { useAnalytics } from '@/contexts/AnalyticsContext';

const { trackEvent, trackPageView, trackUserAction, setUserProperties } = useAnalytics();

// Track custom events
trackEvent('custom_event_name', { 
  property1: 'value1',
  property2: 'value2' 
});

// Track user actions
trackUserAction('click', 'button', 'create_invoice');

// Set user properties
setUserProperties({ 
  plan_type: 'premium',
  company_size: 'small' 
});
```

### 4. Analytics Events Reference

See `src/utils/analytics.ts` for a complete list of tracked events including:
- User authentication events
- Page view events  
- Business action events
- Error and performance events

### 5. Privacy Considerations

- User IDs are automatically tracked when users are authenticated
- No personal information is tracked without consent
- Analytics respect user privacy settings
- Data is anonymized where possible

### 6. Testing Analytics

1. Open browser developer tools
2. Go to Network tab
3. Filter by "google-analytics" or "gtag"
4. Perform actions in the app
5. Verify events are being sent to Google Analytics

### 7. Custom Event Tracking

To add new event tracking:

1. Add event name to `ANALYTICS_EVENTS` in `src/utils/analytics.ts`
2. Use `trackEvent()` function where the event occurs
3. Include relevant metadata for better insights

Example:
```typescript
const handleFeatureUsed = () => {
  trackEvent(ANALYTICS_EVENTS.FEATURE_ACCESSED, {
    feature_name: 'advanced_reporting',
    user_plan: 'premium',
    timestamp: new Date().toISOString()
  });
};
```

### 8. Dashboard Setup

In Google Analytics 4:
1. Create custom dashboards for key metrics
2. Set up conversion goals for important actions
3. Configure custom dimensions for business-specific data
4. Set up audiences for user segmentation

### 9. Key Metrics to Monitor

- User engagement and retention
- Feature adoption rates
- Conversion funnel (signup → first invoice → payment)
- Error rates and performance issues
- User journey patterns

### 10. Compliance

Ensure compliance with:
- GDPR (if serving EU users)
- CCPA (if serving CA users)  
- Other local privacy regulations
- Display appropriate privacy notices
- Provide opt-out mechanisms if required