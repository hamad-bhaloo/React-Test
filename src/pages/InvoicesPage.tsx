
import React, { useState, useEffect } from 'react';
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices';
import { useSubscription } from '@/hooks/useSubscription';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, AlertTriangle, Clock, DollarSign, CheckCircle, Search, Download, BarChart3, FileText, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InvoiceFilters from '@/components/invoices/InvoiceFilters';
import InvoicesList from '@/components/invoices/InvoicesList';
import ImprovedPlanLimitsChecker from '@/components/ImprovedPlanLimitsChecker';
import InvoiceAnalytics from '@/components/analytics/InvoiceAnalytics';
import InvoiceFiltersAnalytics, { InvoiceFilters as AnalyticsFilterType } from '@/components/analytics/InvoiceFilters';
import { useDebtCollections, useOverdueInvoices } from '@/hooks/useDebtCollections';
import { CreateDebtCollectionModal } from '@/components/debt-collection/CreateDebtCollectionModal';
import { DebtCollectionCard } from '@/components/debt-collection/DebtCollectionCard';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { exportInvoicesCSV } from '@/utils/csvExport';
import { CurvedArrow } from '@/components/CurvedArrow';

const InvoicesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('active'); // Default to show only active invoices
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>('all');
  
  const { data: invoices = [], isLoading } = useInvoices({
    invoiceType: invoiceTypeFilter !== 'all' ? invoiceTypeFilter : undefined
  });
  const { usageCounts, planLimits } = useSubscription();
  const { trackEvent, trackUserAction } = useAnalytics();
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Analytics filters
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilterType>({
    dateRange: 'last_30_days',
    status: 'all',
    paymentStatus: 'all',
    clientType: 'all',
    currency: 'USD'
  });
  
  // Debt collection states
  const [debtSearch, setDebtSearch] = useState('');
  const [debtStatusFilter, setDebtStatusFilter] = useState('');
  const [debtPriorityFilter, setDebtPriorityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const navigate = useNavigate();
  const deleteInvoiceMutation = useDeleteInvoice();
  
  // Debt collection data
  const { data: debtCollections = [], isLoading: debtLoading } = useDebtCollections({
    search: debtSearch || undefined,
    status: debtStatusFilter && debtStatusFilter !== 'all' ? debtStatusFilter : undefined,
    priority: debtPriorityFilter && debtPriorityFilter !== 'all' ? debtPriorityFilter : undefined,
  });
  
  const { data: overdueInvoices = [] } = useOverdueInvoices();

  // Check if we can create invoices
  const canCreateInvoice = planLimits.max_invoices === -1 || usageCounts.invoices < planLimits.max_invoices;

  const handleCreateInvoice = () => {
    if (!canCreateInvoice) {
      trackEvent('invoice_creation_blocked', { reason: 'plan_limit_reached' });
      toast.error('Invoice limit reached. Please upgrade your plan to create more invoices.');
      return;
    }
    trackEvent('invoice_creation_started');
    navigate('/invoices/create');
  };

  // Handler functions for invoice actions
  const handleViewInvoice = (invoice: any) => {
    trackEvent('invoice_viewed', { invoice_id: invoice.id, status: invoice.status });
    navigate(`/invoices/view/${invoice.id}`);
  };

  const handleEditInvoice = (invoice: any) => {
    trackEvent('invoice_edit_started', { invoice_id: invoice.id, status: invoice.status });
    navigate(`/invoices/edit/${invoice.id}`);
  };

  const handleDeleteInvoice = (invoice: any) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      trackEvent('invoice_deleted', { invoice_id: invoice.id, status: invoice.status });
      deleteInvoiceMutation.mutate(invoice.id);
    }
  };

  const handleExportInvoicesCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }
    trackEvent('invoices_exported_csv', { 
      count: filteredInvoices.length,
      filters: { status: statusFilter, payment_status: paymentStatusFilter }
    });
    exportInvoicesCSV(filteredInvoices);
    toast.success(`Exported ${filteredInvoices.length} invoices to CSV`);
  };

  const handleAnalyticsFiltersChange = (newFilters: AnalyticsFilterType) => {
    setAnalyticsFilters(newFilters);
  };

  // Debt collection helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      case 'settled': return 'bg-green-100 text-green-800';
      case 'written_off': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalOutstanding = debtCollections.reduce((sum, dc) => {
    const invoice = dc.invoices;
    return sum + Math.max(0, (invoice?.total_amount || 0) - (invoice?.paid_amount || 0));
  }, 0);

  const totalCollected = debtCollections.reduce((sum, dc) => sum + (dc.amount_collected || 0), 0);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (invoice.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    const matchesPaymentStatus = paymentStatusFilter === 'all' || 
      (paymentStatusFilter === 'active' && ['unpaid', 'partial'].includes(invoice.payment_status)) ||
      (paymentStatusFilter === 'partial' && invoice.payment_status === 'partial') ||
      (paymentStatusFilter === 'paid' && invoice.payment_status === 'paid') ||
      (paymentStatusFilter === 'unpaid' && invoice.payment_status === 'unpaid') ||
      (paymentStatusFilter === 'overdue' && invoice.payment_status === 'overdue');
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  // Calculate stats
  const totalInvoices = filteredInvoices.length;
  const totalValue = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const paidInvoices = filteredInvoices.filter(inv => inv.payment_status === 'paid').length;
  const pendingInvoices = filteredInvoices.filter(inv => inv.payment_status === 'unpaid').length;

  // Analytics tracking on page load
  useEffect(() => {
    trackEvent('invoices_page_viewed', {
      total_invoices: invoices.length,
      filtered_count: filteredInvoices.length
    });
  }, [invoices.length, filteredInvoices.length, trackEvent]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Plan Limits Alert */}
      <ImprovedPlanLimitsChecker type="invoices" current={usageCounts.invoices} />

      <Tabs defaultValue="invoices" className="w-full">
        {/* Enterprise Header with Tabs and Actions */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileText size={24} className="text-primary" />
              Invoice Management
            </h1>
            <p className="text-sm text-slate-600">Manage invoices, debt collections, and analytics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <TabsList className="grid w-auto grid-cols-2 h-9">
              <TabsTrigger value="invoices" className="text-sm px-4">Invoices</TabsTrigger>
              <TabsTrigger value="debt-collection" className="text-sm px-4">Debt Collections</TabsTrigger>
            </TabsList>
            
            <Button 
              onClick={() => setShowAnalytics(!showAnalytics)}
              variant="outline"
              size="sm"
              className="h-9"
            >
              <BarChart3 size={16} className="mr-2" />
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
          </div>
        </div>

        <TabsContent value="invoices" className="space-y-4 mt-4">
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleExportInvoicesCSV}
                variant="outline"
                size="sm"
                className="h-9"
                disabled={filteredInvoices.length === 0}
              >
                <Download size={16} className="mr-2" />
                Export CSV
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative inline-block">
                <Button 
                  onClick={() => navigate('/automation')}
                  className="ai-button transition-all duration-300 h-9"
                >
                  <Zap size={16} className="mr-2" />
                  Create with AI
                </Button>
          <CurvedArrow 
            className="absolute -left-36 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block" 
            direction="right"
            animated={true}
          />
              </div>
              <Button 
                onClick={handleCreateInvoice}
                className="bg-primary hover:bg-primary/90 h-9"
                disabled={!canCreateInvoice}
              >
                <Plus size={16} className="mr-2" />
                {canCreateInvoice ? 'Add Invoice' : `Limit Reached`}
              </Button>
            </div>
          </div>

          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Total Invoices</p>
                  <p className="text-2xl font-bold text-slate-900">{totalInvoices}</p>
                  <p className="text-xs text-slate-500">
                    {planLimits.max_invoices === -1 ? 'Unlimited' : `${usageCounts.invoices}/${planLimits.max_invoices} used`}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText size={20} className="text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-emerald-600">${totalValue.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Invoice value</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign size={20} className="text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Paid</p>
                  <p className="text-2xl font-bold text-blue-600">{paidInvoices}</p>
                  <p className="text-xs text-slate-500">Completed invoices</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <CheckCircle size={20} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{pendingInvoices}</p>
                  <p className="text-xs text-slate-500">Awaiting payment</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock size={20} className="text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          {showAnalytics && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-primary" />
                Invoice Analytics
              </h2>
              <InvoiceFiltersAnalytics onFiltersChange={handleAnalyticsFiltersChange} />
              <InvoiceAnalytics filters={analyticsFilters} />
            </div>
          )}

          {/* Compact Filters Row */}
          <div className="bg-slate-50/80 backdrop-blur-sm rounded-lg p-4 border border-slate-200/60">
            <InvoiceFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              paymentStatusFilter={paymentStatusFilter}
              onPaymentStatusFilterChange={setPaymentStatusFilter}
              invoiceTypeFilter={invoiceTypeFilter}
              onInvoiceTypeFilterChange={setInvoiceTypeFilter}
            />
          </div>

          {/* Invoices List */}
          <InvoicesList
            invoices={filteredInvoices}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            canCreateInvoice={canCreateInvoice}
            onCreateInvoice={handleCreateInvoice}
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
          />
        </TabsContent>

        <TabsContent value="debt-collection" className="space-y-4 mt-4">
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Collection Cases</h2>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 h-9"
            >
              <Plus size={16} className="mr-2" />
              Create Case
            </Button>
          </div>

          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Active Cases</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {debtCollections.filter(dc => dc.status !== 'settled' && dc.status !== 'written_off' && dc.status !== 'closed').length}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">${totalOutstanding.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10">
                  <DollarSign size={20} className="text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Collected</p>
                  <p className="text-2xl font-bold text-emerald-600">${totalCollected.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle size={20} className="text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Overdue</p>
                  <p className="text-2xl font-bold text-orange-600">{overdueInvoices.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Clock size={20} className="text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Compact Filters Row */}
          <div className="bg-slate-50/80 backdrop-blur-sm rounded-lg p-4 border border-slate-200/60">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice number or notes..."
                    value={debtSearch}
                    onChange={(e) => setDebtSearch(e.target.value)}
                    className="pl-9 h-9 bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={debtStatusFilter} onValueChange={setDebtStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36 h-9 bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="written_off">Written Off</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={debtPriorityFilter} onValueChange={setDebtPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-32 h-9 bg-white">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Collection Cases */}
          {debtLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {debtCollections.length === 0 ? (
                <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No debt collection cases</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by creating a collection case for overdue invoices
                      </p>
                      <Button onClick={() => setShowCreateModal(true)}>
                        Create Collection Case
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Active Cases */}
                  {debtCollections.filter(dc => dc.status !== 'closed' && dc.status !== 'settled' && dc.status !== 'written_off').length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-slate-900">Active Cases</h3>
                      <div className="space-y-3">
                        {debtCollections
                          .filter(dc => dc.status !== 'closed' && dc.status !== 'settled' && dc.status !== 'written_off')
                          .map((debtCollection) => (
                            <DebtCollectionCard 
                              key={debtCollection.id} 
                              debtCollection={debtCollection}
                              getStatusColor={getStatusColor}
                              getPriorityColor={getPriorityColor}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Closed Cases */}
                  {debtCollections.filter(dc => dc.status === 'closed' || dc.status === 'settled' || dc.status === 'written_off').length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Closed Cases</h3>
                      <div className="space-y-2">
                        {debtCollections
                          .filter(dc => dc.status === 'closed' || dc.status === 'settled' || dc.status === 'written_off')
                          .map((debtCollection) => (
                            <DebtCollectionCard 
                              key={debtCollection.id} 
                              debtCollection={debtCollection}
                              getStatusColor={getStatusColor}
                              getPriorityColor={getPriorityColor}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <CreateDebtCollectionModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            overdueInvoices={overdueInvoices}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoicesPage;
