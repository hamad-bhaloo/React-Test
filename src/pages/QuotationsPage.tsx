import React, { useState } from 'react';
import { useQuotations, useDeleteQuotation, useConvertQuotationToInvoice } from '@/hooks/useQuotations';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, TrendingUp, Clock, CheckCircle, Search, BarChart3, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImprovedPlanLimitsChecker from '@/components/ImprovedPlanLimitsChecker';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import QuotationTableWithPagination from '@/components/quotations/QuotationTableWithPagination';
import QuotationCard from '@/components/quotations/QuotationCard';
import QuotationAnalytics from '@/components/analytics/QuotationAnalytics';
import QuotationFilters, { QuotationFilterType } from '@/components/analytics/QuotationFilters';

const QuotationsPage = () => {
  const { data: quotations = [], isLoading } = useQuotations();
  const { usageCounts, planLimits } = useSubscription();
  const [filters, setFilters] = useState<QuotationFilterType>({
    search: '',
    status: 'all',
    dateRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [activeTab, setActiveTab] = useState('overview');
  
  const navigate = useNavigate();
  const deleteQuotationMutation = useDeleteQuotation();
  const convertToInvoiceMutation = useConvertQuotationToInvoice();

  // Check if we can create quotations (using invoice limits for now)
  const canCreateQuotation = planLimits.max_invoices === -1 || usageCounts.invoices < planLimits.max_invoices;

  const handleCreateQuotation = () => {
    if (!canCreateQuotation) {
      toast.error('Quotation limit reached. Please upgrade your plan to create more quotations.');
      return;
    }
    navigate('/quotations/create');
  };

  const handleViewQuotation = (quotation: any) => {
    navigate(`/quotations/view/${quotation.id}`);
  };

  const handleEditQuotation = (quotation: any) => {
    navigate(`/quotations/edit/${quotation.id}`);
  };

  const handleDeleteQuotation = (quotation: any) => {
    if (window.confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      deleteQuotationMutation.mutate(quotation.id);
    }
  };

  const handleConvertToInvoice = (quotation: any) => {
    if (window.confirm('Convert this quotation to an invoice? This action cannot be undone.')) {
      convertToInvoiceMutation.mutate(quotation.id, {
        onSuccess: (invoice) => {
          navigate(`/invoices/view/${invoice.id}`);
        }
      });
    }
  };

  // Calculate summary stats
  const totalQuotations = quotations.length;
  const draftQuotations = quotations.filter(q => q.status === 'draft').length;
  const sentQuotations = quotations.filter(q => q.status === 'sent').length;
  const acceptedQuotations = quotations.filter(q => q.status === 'accepted').length;
  const convertedQuotations = quotations.filter(q => q.status === 'converted').length;
  const totalValue = quotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = 
      quotation.quotation_number.toLowerCase().includes(filters.search.toLowerCase()) ||
      (quotation.clients?.name?.toLowerCase().includes(filters.search.toLowerCase()) ?? false) ||
      (quotation.clients?.company?.toLowerCase().includes(filters.search.toLowerCase()) ?? false);
    
    const matchesStatus = filters.status === 'all' || quotation.status === filters.status;
    
    // Date range filtering
    let matchesDate = true;
    if (filters.dateRange !== 'all') {
      const quotationDate = new Date(quotation.created_at);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          matchesDate = quotationDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = quotationDate >= weekAgo;
          break;
        case 'month':
          matchesDate = quotationDate.getMonth() === now.getMonth() && quotationDate.getFullYear() === now.getFullYear();
          break;
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const quotationQuarter = Math.floor(quotationDate.getMonth() / 3);
          matchesDate = quotationQuarter === currentQuarter && quotationDate.getFullYear() === now.getFullYear();
          break;
        case 'year':
          matchesDate = quotationDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    const { sortBy, sortOrder } = filters;
    let aValue = a[sortBy as keyof typeof a];
    let bValue = b[sortBy as keyof typeof b];
    
    if (sortBy === 'created_at') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Limits Alert */}
      <ImprovedPlanLimitsChecker type="invoices" current={usageCounts.invoices} />

      {/* Header matching Client page style */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <FileText size={24} className="text-primary" />
            Quotation Management
          </h1>
          <p className="text-sm text-slate-600">Create and manage quotations before converting to invoices</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setActiveTab(activeTab === 'analytics' ? 'overview' : 'analytics')}
            variant="outline"
            size="sm"
            className="h-9"
          >
            <BarChart3 size={16} className="mr-2" />
            {activeTab === 'analytics' ? 'Hide Analytics' : 'Show Analytics'}
          </Button>
          <Button 
            onClick={handleCreateQuotation}
            className="bg-primary hover:bg-primary/90 h-9"
            disabled={!canCreateQuotation}
          >
            <Plus size={16} className="mr-2" />
            {canCreateQuotation ? 'Create Quotation' : 'Limit Reached'}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-3 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="quotations" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quotations
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {activeTab === 'quotations' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 backdrop-blur-sm">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-3"
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="h-8 px-3"
                >
                  Cards
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-foreground">{totalQuotations}</p>
                    <p className="text-xs text-muted-foreground">All quotations</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Draft</p>
                    <p className="text-2xl font-bold text-muted-foreground">{draftQuotations}</p>
                    <p className="text-xs text-muted-foreground">Not sent yet</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500/20 to-gray-500/10">
                    <Clock className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                    <p className="text-2xl font-bold text-green-600">{acceptedQuotations}</p>
                    <p className="text-xs text-muted-foreground">Ready to convert</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold text-primary">${totalValue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{convertedQuotations} converted</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Analytics */}
          <QuotationAnalytics quotations={quotations} />
        </TabsContent>

        {/* Quotations List Tab */}
        <TabsContent value="quotations" className="space-y-6">
          {/* Filters */}
          <QuotationFilters 
            filters={filters} 
            onFiltersChange={setFilters}
            quotationsCount={filteredQuotations.length}
          />

          {/* Content */}
          {filteredQuotations.length === 0 ? (
            <Card className="bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
              <CardContent className="p-12 text-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-muted/50 to-muted/30 w-fit mx-auto mb-6">
                  <FileText size={48} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No quotations found</h3>
                <p className="text-muted-foreground mb-6">
                  {filters.search || filters.status !== 'all' || filters.dateRange !== 'all'
                    ? 'No quotations match your current filters.' 
                    : 'Create your first quotation to get started.'
                  }
                </p>
                {(!filters.search && filters.status === 'all' && filters.dateRange === 'all') && (
                  <Button 
                    onClick={handleCreateQuotation}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    disabled={!canCreateQuotation}
                  >
                    <Plus size={16} className="mr-2" />
                    Create Quotation
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === 'table' ? (
                <QuotationTableWithPagination
                  quotations={filteredQuotations}
                  onView={handleViewQuotation}
                  onEdit={handleEditQuotation}
                  onDelete={handleDeleteQuotation}
                  onConvertToInvoice={handleConvertToInvoice}
                  onSendSuccess={() => window.location.reload()}
                />
              ) : (
                <div className="grid gap-4">
                  {filteredQuotations.map((quotation) => (
                    <QuotationCard
                      key={quotation.id}
                      quotation={quotation}
                      onView={handleViewQuotation}
                      onEdit={handleEditQuotation}
                      onDelete={handleDeleteQuotation}
                      onConvertToInvoice={handleConvertToInvoice}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <QuotationAnalytics quotations={quotations} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuotationsPage;