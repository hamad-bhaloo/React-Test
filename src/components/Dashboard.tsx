
import { useState } from "react";
import StatsCards from "./StatsCards";
import WorkingCapitalChart from "./WorkingCapitalChart";
import ScheduledTransfers from "./ScheduledTransfers";
import RecentTransactions from "./RecentTransactions";
import SummarySection from "./SummarySection";
import DashboardFilters, { DashboardFilters as FilterType } from "./analytics/DashboardFilters";
import InvoiceStatusChart from "./analytics/InvoiceStatusChart";
import ClientActivityChart from "./analytics/ClientActivityChart";
import PaymentMethodsChart from "./analytics/PaymentMethodsChart";
import MonthlyTrendChart from "./analytics/MonthlyTrendChart";
import CurrencySelector from "./CurrencySelector";
import { Calendar, TrendingUp, Target, BarChart3 } from "lucide-react";

const Dashboard = () => {
  const [filters, setFilters] = useState<FilterType>({
    dateRange: 'last_year',
    clientType: 'all',
    invoiceStatus: 'all',
    paymentStatus: 'all',
    currency: 'USD'
  });

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <BarChart3 size={24} className="text-primary" />
            Dashboard Insights
          </h1>
          <p className="text-sm text-slate-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <CurrencySelector />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <Calendar size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <DashboardFilters onFiltersChange={handleFiltersChange} />
      
      {/* Stats Cards */}
      <StatsCards />
      
      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Primary Chart - Revenue Analytics */}
        <div className="xl:col-span-2">
          <WorkingCapitalChart />
        </div>
        
        {/* Monthly Trends */}
        <div className="xl:col-span-2">
          <MonthlyTrendChart filters={filters} />
        </div>
      </div>
      
      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Invoice Status Distribution */}
        <div>
          <InvoiceStatusChart filters={filters} />
        </div>
        
        {/* Payment Methods */}
        <div>
          <PaymentMethodsChart filters={filters} />
        </div>
        
        {/* Client Activity */}
        <div className="md:col-span-2">
          <ClientActivityChart filters={filters} />
        </div>
      </div>

      {/* Quick Metrics & Side Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Quick Metrics */}
        <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Target size={16} className="text-primary" />
            Performance Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Conversion Rate</span>
              <span className="text-sm font-bold text-emerald-600">87.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Avg. Invoice Value</span>
              <span className="text-sm font-bold text-slate-900">$2,456</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Collection Time</span>
              <span className="text-sm font-bold text-amber-600">12 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Active Clients</span>
              <span className="text-sm font-bold text-blue-600">156</span>
            </div>
          </div>
        </div>
        
        {/* Scheduled Transfers - Compact */}
        <div>
          <ScheduledTransfers />
        </div>
        
        {/* Recent Transactions - More Compact */}
        <div className="xl:col-span-2">
          <RecentTransactions />
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1">
          <SummarySection />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
