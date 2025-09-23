import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { SecurityProvider } from '@/components/SecurityProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { usePageTracking } from '@/hooks/usePageTracking';
import SharedLayout from './components/SharedLayout';
import Dashboard from './pages/Index';
import Clients from './pages/ClientsPage';
import Invoices from './pages/InvoicesPage';
import Settings from './pages/SettingsPage';
import Login from './pages/AuthPage';
import Register from './pages/AuthPage';
import ForgotPassword from './pages/AuthPage';
import ResetPassword from './pages/AuthPage';
import Products from './pages/InvoicesPage';
import Templates from './pages/InvoiceTemplatesPage';
import TemplateSelectionPage from './pages/TemplateSelectionPage';
import PublicPaymentPage from './pages/PublicPaymentPage';
import PublicInvoicePage from './pages/PublicInvoicePage';
import CompanyPage from './pages/CompanyPage';
import WalletPage from './pages/WalletPage';
import SubscriptionPage from './pages/SubscriptionPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import EditInvoicePage from './pages/EditInvoicePage';
import ViewInvoicePage from './pages/ViewInvoicePage';
import AutomationPage from './pages/AutomationPage';
import IntegrationsPage from './pages/IntegrationsPage';
import QuotationsPage from './pages/QuotationsPage';
import CreateQuotationPage from './pages/CreateQuotationPage';
import ViewQuotationPage from './pages/ViewQuotationPage';
import EditQuotationPage from './pages/EditQuotationPage';
import PublicQuotationPage from './pages/PublicQuotationPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import ExpensesPage from './pages/ExpensesPage';
import POSPage from './pages/POSPage';
import POSSystemPage from './pages/POSSystemPage';
import ReminderLogsPage from './pages/ReminderLogsPage';

import ReportsPage from './pages/ReportsPage';
import ApiDocumentationPage from './pages/ApiDocumentationPage';

import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminReminderLogs from './pages/admin/AdminReminderLogs';
import AcceptInvitePage from './pages/AcceptInvitePage';
import { XBot } from './components/XBot';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppWithTracking = () => {
  usePageTracking();
  return null;
};

function App() {
  // Listen for session expiry events
  React.useEffect(() => {
    const handleSessionExpired = () => {
      const { toast } = require('sonner');
      toast.error('Your session has expired. Please sign in again.');
    };

    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <SecurityProvider>
        <AuthProvider>
          <AnalyticsProvider>
            <LanguageProvider>
              <SettingsProvider>
                <CurrencyProvider>
                  <Router>
                    <AppWithTracking />
                    <div className="min-h-screen bg-background">
                      <Toaster />
                      <XBot />
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/auth" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/payment/:paymentLinkId" element={<PublicPaymentPage />} />
                        <Route path="/invoice/:invoiceId/:paymentLinkId" element={<PublicInvoicePage />} />
                        <Route path="/quotation/:quotationId" element={<PublicQuotationPage />} />
                        <Route path="/payment-success" element={<PaymentSuccessPage />} />
                        <Route path="/payment-cancel" element={<PaymentCancelPage />} />
                        <Route path="/accept-invitation/:token" element={<AcceptInvitePage />} />
                        
                        {/* Separate POS System */}
                        <Route path="/pos-system" element={<POSSystemPage />} />
                        
                        {/* Admin routes */}
                        <Route path="/admin/*" element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }>
                           <Route path="dashboard" element={<AdminDashboard />} />
                           <Route path="users" element={<AdminUsers />} />
                           <Route path="analytics" element={<AdminAnalytics />} />
                           <Route path="reminder-logs" element={<AdminReminderLogs />} />
                           <Route path="invoices" element={<div>Admin Invoices (Coming Soon)</div>} />
                           <Route path="settings" element={<div>Admin Settings (Coming Soon)</div>} />
                        </Route>
                        
                        {/* All main app routes wrapped with SharedLayout */}
                        <Route path="/*" element={<SharedLayout />}>
                          <Route index element={<Dashboard />} />
                          <Route path="clients" element={<Clients />} />
                          <Route path="quotations" element={<QuotationsPage />} />
                          <Route path="quotations/create" element={<CreateQuotationPage />} />
                          <Route path="quotations/view/:id" element={<ViewQuotationPage />} />
                          <Route path="quotations/edit/:id" element={<EditQuotationPage />} />
                          <Route path="invoices" element={<Invoices />} />
                          <Route path="invoices/create" element={<CreateInvoicePage />} />
                          
                          <Route path="invoices/edit/:id" element={<EditInvoicePage />} />
                          <Route path="invoices/view/:id" element={<ViewInvoicePage />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="products" element={<Products />} />
                          <Route path="templates" element={<Templates />} />
                          <Route path="invoice-templates" element={<TemplateSelectionPage />} />
                          <Route path="company" element={<CompanyPage />} />
                          <Route path="wallet" element={<WalletPage />} />
                          <Route path="subscription" element={<SubscriptionPage />} />
                          <Route path="automation" element={<AutomationPage />} />
                          <Route path="integrations" element={<IntegrationsPage />} />
                          <Route path="expenses" element={<ExpensesPage />} />
                          <Route path="pos" element={<POSPage />} />
                          <Route path="reminder-logs" element={<ReminderLogsPage />} />
                          <Route path="reports" element={<ReportsPage />} />
                          <Route path="api-docs" element={<ApiDocumentationPage />} />
                          
                        </Route>
                      </Routes>
                    </div>
                  </Router>
                </CurrencyProvider>
              </SettingsProvider>
            </LanguageProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </SecurityProvider>
    </QueryClientProvider>
  );
}

export default App;