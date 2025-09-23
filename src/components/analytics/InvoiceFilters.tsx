import React, { useState } from 'react';
import { Filter, FileText, DollarSign, Calendar, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface InvoiceFiltersProps {
  onFiltersChange: (filters: InvoiceFilters) => void;
}

export interface InvoiceFilters {
  dateRange: string;
  status: string;
  paymentStatus: string;
  clientType: string;
  currency: string;
}

const InvoiceFilters = ({ onFiltersChange }: InvoiceFiltersProps) => {
  const [filters, setFilters] = useState<InvoiceFilters>({
    dateRange: 'last_30_days',
    status: 'all',
    paymentStatus: 'all',
    clientType: 'all',
    currency: 'USD'
  });

  const handleFilterChange = (key: keyof InvoiceFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: InvoiceFilters = {
      dateRange: 'last_30_days',
      status: 'all',
      paymentStatus: 'all',
      clientType: 'all',
      currency: 'USD'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <Card className="p-4 mb-4 bg-gradient-to-r from-slate-50 to-white border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <Filter size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-slate-900">Invoice Analytics Filters</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Date Range */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <Calendar size={12} />
            Period
          </label>
          <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="last_6_months">Last 6 months</SelectItem>
              <SelectItem value="last_year">Last year</SelectItem>
              <SelectItem value="all_time">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoice Status */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <FileText size={12} />
            Status
          </label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment Status */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <DollarSign size={12} />
            Payment
          </label>
          <Select value={filters.paymentStatus} onValueChange={(value) => handleFilterChange('paymentStatus', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client Type */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <Users size={12} />
            Client Type
          </label>
          <Select value={filters.clientType} onValueChange={(value) => handleFilterChange('clientType', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="organization">Organization</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <DollarSign size={12} />
            Currency
          </label>
          <Select value={filters.currency} onValueChange={(value) => handleFilterChange('currency', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <div className="space-y-1 flex flex-col justify-end">
          <label className="text-xs font-medium text-transparent select-none">Reset</label>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className="h-8 text-xs w-full"
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default InvoiceFilters;