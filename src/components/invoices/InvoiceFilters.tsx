
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Search } from 'lucide-react';

interface InvoiceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  paymentStatusFilter?: string;
  onPaymentStatusFilterChange?: (value: string) => void;
  invoiceTypeFilter?: string;
  onInvoiceTypeFilterChange?: (value: string) => void;
}

const InvoiceFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentStatusFilter = 'all',
  onPaymentStatusFilterChange,
  invoiceTypeFilter = 'all',
  onInvoiceTypeFilterChange
}: InvoiceFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices by number, client name, or company..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-white"
          />
        </div>
      </div>
      <div className="flex gap-2">
        {onInvoiceTypeFilterChange && (
          <SearchableSelect
            value={invoiceTypeFilter}
            onValueChange={onInvoiceTypeFilterChange}
            options={[
              { label: 'All Types', value: 'all' },
              { label: 'Regular Invoices', value: 'regular' },
              { label: 'POS Invoices', value: 'pos' },
            ]}
            placeholder="Type"
            className="w-full sm:w-32 h-9"
          />
        )}
        <SearchableSelect
          value={statusFilter}
          onValueChange={onStatusFilterChange}
          options={[
            { label: 'All Statuses', value: 'all' },
            { label: 'Draft', value: 'draft' },
            { label: 'Sent', value: 'sent' },
            { label: 'Paid', value: 'paid' },
            { label: 'Overdue', value: 'overdue' },
          ]}
          placeholder="Status"
          className="w-full sm:w-32 h-9"
        />
        {onPaymentStatusFilterChange && (
          <SearchableSelect
            value={paymentStatusFilter}
            onValueChange={onPaymentStatusFilterChange}
            options={[
              { label: 'All Payments', value: 'all' },
              { label: 'Active (Unpaid/Partial)', value: 'active' },
              { label: 'Paid', value: 'paid' },
              { label: 'Unpaid', value: 'unpaid' },
              { label: 'Partially Paid', value: 'partial' },
              { label: 'Overdue', value: 'overdue' },
            ]}
            placeholder="Payment"
            className="w-full sm:w-44 h-9"
          />
        )}
      </div>
    </div>
  );
};

export default InvoiceFilters;
