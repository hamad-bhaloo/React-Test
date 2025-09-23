
import React, { useState, useEffect } from "react";
import { Users, Plus, Eye, Edit, Trash2, MoreHorizontal, Building2, User, Download, BarChart3, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useAnalytics } from "@/contexts/AnalyticsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import { useClients } from "@/hooks/useClients";
import { useDeleteClient } from "@/hooks/useDeleteClient";
import { useSubscription } from "@/hooks/useSubscription";
import AddClientModal from "@/components/AddClientModal";
import EditClientModal from "@/components/EditClientModal";
import ViewClientModal from "@/components/ViewClientModal";
import PlanLimitsChecker from "@/components/PlanLimitsChecker";
import ImprovedPlanLimitsChecker from "@/components/ImprovedPlanLimitsChecker";
import SubscriptionModal from "@/components/SubscriptionModal";
import ClientFilters, { ClientFilters as FilterType } from "@/components/analytics/ClientFilters";
import ClientAnalytics from "@/components/analytics/ClientAnalytics";
import { useLanguage } from "@/contexts/LanguageContext";
import { exportClientsCSV } from "@/utils/csvExport";
import { toast } from "sonner";

const ClientsPage = () => {
  const { t } = useLanguage();
  const { trackEvent } = useAnalytics();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [filters, setFilters] = useState<FilterType>({
    clientType: 'all',
    status: 'all',
    industry: 'all',
    country: 'all',
    dateRange: 'all_time'
  });

  const ITEMS_PER_PAGE = 10;

  const { data: clients = [], isLoading, error } = useClients();
  const { checkLimits, usageCounts, planLimits } = useSubscription();
  const deleteClient = useDeleteClient();

  // Analytics tracking on page load
  useEffect(() => {
    trackEvent('clients_page_viewed', {
      total_clients: clients.length
    });
  }, [clients.length, trackEvent]);

  const handleView = (client: any) => {
    trackEvent('client_viewed', { client_id: client.id });
    setSelectedClient(client);
    setShowViewModal(true);
  };

  const handleEdit = (client: any) => {
    trackEvent('client_edit_started', { client_id: client.id });
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleDelete = (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      trackEvent('client_deleted', { client_id: clientId });
      deleteClient.mutate(clientId);
    }
  };

  const handleUpgrade = () => {
    setShowSubscriptionModal(true);
  };

  const handleExportCSV = () => {
    if (filteredClients.length === 0) {
      toast.error('No clients to export');
      return;
    }
    trackEvent('clients_exported_csv', { count: filteredClients.length });
    exportClientsCSV(filteredClients);
    toast.success(`Exported ${filteredClients.length} clients to CSV`);
  };

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Check if we can add more clients
  const canAddClients = planLimits.max_clients === -1 || usageCounts.clients < planLimits.max_clients;

  // Apply filters to clients
  const filteredClients = clients.filter(client => {
    const matchesType = filters.clientType === 'all' || client.client_type === filters.clientType;
    const matchesStatus = filters.status === 'all' || client.status === filters.status;
    const matchesIndustry = filters.industry === 'all' || client.industry === filters.industry;
    const matchesCountry = filters.country === 'all' || client.country === filters.country;
    
    let matchesDate = true;
    if (filters.dateRange !== 'all_time') {
      const daysMap = {
        'last_7_days': 7,
        'last_30_days': 30,
        'last_90_days': 90,
        'last_year': 365
      };
      const days = daysMap[filters.dateRange as keyof typeof daysMap];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      matchesDate = new Date(client.created_at) >= startDate;
    }
    
    return matchesType && matchesStatus && matchesIndustry && matchesCountry && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  // Calculate summary stats
  const totalClients = filteredClients.length;
  const individualClients = filteredClients.filter(client => client.client_type === 'individual').length;
  const organizationClients = filteredClients.filter(client => client.client_type === 'business' || client.client_type === 'organization').length;

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => goToPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => goToPage(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <span className="flex h-9 w-9 items-center justify-center">...</span>
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => goToPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <span className="flex h-9 w-9 items-center justify-center">...</span>
          </PaginationItem>
        );
      }

      // Always show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => goToPage(totalPages)}
              isActive={currentPage === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading clients</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

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
      <ImprovedPlanLimitsChecker type="clients" current={usageCounts.clients} />

      {/* Enterprise Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Users size={24} className="text-primary" />
            Client Management
          </h1>
          <p className="text-sm text-slate-600">Manage your client relationships and analytics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowAnalytics(!showAnalytics)}
            variant="outline"
            size="sm"
            className="h-9"
          >
            <BarChart3 size={16} className="mr-2" />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </Button>
          <Button 
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-9"
            disabled={filteredClients.length === 0}
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary/90 h-9"
            disabled={!canAddClients}
          >
            <Plus size={16} className="mr-2" />
            {canAddClients ? t('clients.add') : 'Limit Reached'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ClientFilters onFiltersChange={handleFiltersChange} />

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">Total Clients</p>
              <p className="text-2xl font-bold text-slate-900">{totalClients}</p>
              <p className="text-xs text-slate-500">
                {planLimits.max_clients === -1 ? 'Unlimited' : `${usageCounts.clients}/${planLimits.max_clients} used`}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users size={20} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">Individual</p>
              <p className="text-2xl font-bold text-emerald-600">{individualClients}</p>
              <p className="text-xs text-slate-500">Personal clients</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <User size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">Organizations</p>
              <p className="text-2xl font-bold text-purple-600">{organizationClients}</p>
              <p className="text-xs text-slate-500">Business clients</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Building2 size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">Growth Rate</p>
              <p className="text-2xl font-bold text-amber-600">+12.5%</p>
              <p className="text-xs text-slate-500">This month</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <TrendingUp size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Client Analytics
          </h2>
          <ClientAnalytics filters={filters} />
        </div>
      )}

      {/* Enhanced Clients Table */}
      <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="font-semibold text-slate-700">{t('clients.name')}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t('clients.email')}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t('clients.company')}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t('clients.phone')}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t('clients.status')}</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right w-20">{t('clients.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentClients.map((client: any) => (
              <TableRow key={client.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                      {client.client_type === 'business' || client.client_type === 'organization' ? (
                        <Building2 size={16} className="text-primary" />
                      ) : (
                        <User size={16} className="text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">
                        {client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed Client'}
                      </div>
                      {client.client_type && (
                        <div className="text-xs text-slate-500 capitalize">{client.client_type}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-700">{client.email || '-'}</TableCell>
                <TableCell className="text-sm text-slate-700">{client.company || '-'}</TableCell>
                <TableCell className="text-sm text-slate-700">{client.phone || '-'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={client.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {t(`common.${client.status}`) || client.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white shadow-lg border-slate-200">
                      <DropdownMenuItem onClick={() => handleView(client)}>
                        <Eye size={14} className="mr-2" />
                        {t('clients.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(client)}>
                        <Edit size={14} className="mr-2" />
                        {t('clients.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(client.id)}
                        className="text-red-600 hover:bg-red-50"
                        disabled={deleteClient.isPending}
                      >
                        <Trash2 size={14} className="mr-2" />
                        {deleteClient.isPending ? 'Deleting...' : t('clients.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">{t('clients.noClients')}</h3>
            <p className="text-sm text-slate-600 mb-4">{t('clients.getStarted')}</p>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus size={16} className="mr-2" />
              {t('clients.add')}
            </Button>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredClients.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200/60">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of {filteredClients.length} clients
              </div>
              <Pagination className="mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => goToPage(Math.max(1, currentPage - 1))}
                      className={`cursor-pointer ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                      className={`cursor-pointer ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <EditClientModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        client={selectedClient}
      />

      <ViewClientModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        client={selectedClient}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
};

export default ClientsPage;
