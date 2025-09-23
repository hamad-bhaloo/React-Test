import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Filter,
  X,
  Users,
  DollarSign,
  Tag
} from 'lucide-react';

interface ReportFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const datePresets = [
    { label: 'Last 7 days', value: 'last-7-days' },
    { label: 'Last 30 days', value: 'last-30-days' },
    { label: 'Last 3 months', value: 'last-3-months' },
    { label: 'Last 6 months', value: 'last-6-months' },
    { label: 'Last 12 months', value: 'last-12-months' },
    { label: 'This year', value: 'this-year' },
    { label: 'Last year', value: 'last-year' },
    { label: 'Custom range', value: 'custom' }
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Sent', value: 'sent' },
    { label: 'Viewed', value: 'viewed' },
    { label: 'Paid', value: 'paid' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  const paymentStatusOptions = [
    { label: 'All Payment Status', value: 'all' },
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Overdue', value: 'overdue' }
  ];

  const currencyOptions = [
    { label: 'All Currencies', value: 'all' },
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'GBP (£)', value: 'GBP' },
    { label: 'CAD (C$)', value: 'CAD' }
  ];

  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== 'all' && value !== ''
  ).length;

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: 'last-30-days',
      customDateFrom: null,
      customDateTo: null,
      clients: [],
      status: 'all',
      paymentStatus: 'all',
      currency: 'all',
      tags: [],
      amountMin: '',
      amountMax: ''
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Date Range</label>
          </div>
          <Select 
            value={filters.dateRange} 
            onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {datePresets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                selected={filters.customDateFrom}
                onSelect={(date) => onFiltersChange({ ...filters, customDateFrom: date })}
                placeholder="From date"
              />
              <DatePicker
                selected={filters.customDateTo}
                onSelect={(date) => onFiltersChange({ ...filters, customDateTo: date })}
                placeholder="To date"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Status Filters */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Invoice Status</label>
          <Select 
            value={filters.status} 
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Payment Status</label>
          <Select 
            value={filters.paymentStatus} 
            onValueChange={(value) => onFiltersChange({ ...filters, paymentStatus: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment status" />
            </SelectTrigger>
            <SelectContent>
              {paymentStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Currency Filter */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Currency</label>
          </div>
          <Select 
            value={filters.currency} 
            onValueChange={(value) => onFiltersChange({ ...filters, currency: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Amount Range */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Amount Range</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <input
                type="number"
                placeholder="Min amount"
                value={filters.amountMin}
                onChange={(e) => onFiltersChange({ ...filters, amountMin: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-1">
              <input
                type="number"
                placeholder="Max amount"
                value={filters.amountMax}
                onChange={(e) => onFiltersChange({ ...filters, amountMax: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Advanced Options */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Advanced Options</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-drafts" 
                checked={filters.includeDrafts}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, includeDrafts: checked })}
              />
              <label htmlFor="include-drafts" className="text-sm">
                Include draft invoices
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-deleted" 
                checked={filters.includeDeleted}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, includeDeleted: checked })}
              />
              <label htmlFor="include-deleted" className="text-sm">
                Include deleted invoices
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="group-by-client" 
                checked={filters.groupByClient}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, groupByClient: checked })}
              />
              <label htmlFor="group-by-client" className="text-sm">
                Group by client
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};