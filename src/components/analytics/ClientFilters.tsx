import React, { useState } from 'react';
import { Filter, Users, Building2, MapPin, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ClientFiltersProps {
  onFiltersChange: (filters: ClientFilters) => void;
}

export interface ClientFilters {
  clientType: string;
  status: string;
  industry: string;
  country: string;
  dateRange: string;
}

const ClientFilters = ({ onFiltersChange }: ClientFiltersProps) => {
  const [filters, setFilters] = useState<ClientFilters>({
    clientType: 'all',
    status: 'all',
    industry: 'all',
    country: 'all',
    dateRange: 'all_time'
  });

  const handleFilterChange = (key: keyof ClientFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: ClientFilters = {
      clientType: 'all',
      status: 'all',
      industry: 'all',
      country: 'all',
      dateRange: 'all_time'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <Card className="p-4 mb-4 bg-gradient-to-r from-slate-50 to-white border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <Filter size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-slate-900">Client Filters</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Client Type */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <Users size={12} />
            Type
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

        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <Filter size={12} />
            Status
          </label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Industry */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <Building2 size={12} />
            Industry
          </label>
          <Select value={filters.industry} onValueChange={(value) => handleFilterChange('industry', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Country */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <MapPin size={12} />
            Country
          </label>
          <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <Calendar size={12} />
            Added
          </label>
          <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="all_time">All Time</SelectItem>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="last_year">Last year</SelectItem>
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

export default ClientFilters;