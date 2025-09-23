import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface QuotationFilterType {
  search: string;
  status: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface QuotationFiltersProps {
  filters: QuotationFilterType;
  onFiltersChange: (filters: QuotationFilterType) => void;
  quotationsCount?: number;
}

const QuotationFilters: React.FC<QuotationFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  quotationsCount = 0 
}) => {
  const handleFilterChange = (key: keyof QuotationFilterType, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      dateRange: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.dateRange !== 'all';

  return (
    <Card className="bg-gradient-to-r from-background/95 via-background to-background/95 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quotations by number, client, or company..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus:bg-background"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-[140px]">
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="min-w-[140px]">
            <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
              <SelectTrigger className="bg-background/50 border-border/50">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue placeholder="Date Range" />
                </div>
              </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="min-w-[140px]">
            <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc');
            }}>
              <SelectTrigger className="bg-background/50 border-border/50">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Sort By" />
                </div>
              </SelectTrigger>
            <SelectContent align="end" side="bottom">
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="total_amount-desc">Highest Value</SelectItem>
              <SelectItem value="total_amount-asc">Lowest Value</SelectItem>
              <SelectItem value="quotation_number-asc">Number A-Z</SelectItem>
              <SelectItem value="quotation_number-desc">Number Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center gap-2 px-3"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing {quotationsCount} quotations</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Filtered
              </Badge>
            )}
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              {filters.search && (
                <Badge variant="outline" className="text-xs">
                  Search: "{filters.search}"
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Status: {filters.status}
                </Badge>
              )}
              {filters.dateRange !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Period: {filters.dateRange}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuotationFilters;