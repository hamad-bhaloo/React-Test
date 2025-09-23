
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Grid3X3, List } from 'lucide-react';
import InvoiceCard from './InvoiceCard';
import InvoiceTableWithPagination from './InvoiceTableWithPagination';

interface InvoicesListProps {
  invoices: any[];
  searchTerm: string;
  statusFilter: string;
  canCreateInvoice: boolean;
  onCreateInvoice: () => void;
  onViewInvoice: (invoice: any) => void;
  onEditInvoice: (invoice: any) => void;
  onDeleteInvoice: (invoice: any) => void;
}

const InvoicesList = ({
  invoices,
  searchTerm,
  statusFilter,
  canCreateInvoice,
  onCreateInvoice,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice
}: InvoicesListProps) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' ? 'No invoices found matching your filters.' : 'No invoices created yet.'}
          </div>
          {!searchTerm && statusFilter === 'all' && canCreateInvoice && (
            <Button onClick={onCreateInvoice} className="bg-orange-500 hover:bg-orange-600">
              <Plus size={16} className="mr-2" />
              Create Your First Invoice
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8 px-3"
          >
            <List size={16} className="mr-1" />
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="h-8 px-3"
          >
            <Grid3X3 size={16} className="mr-1" />
            Cards
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <InvoiceTableWithPagination
          invoices={invoices}
          onView={onViewInvoice}
          onEdit={onEditInvoice}
          onDelete={onDeleteInvoice}
        />
      ) : (
        <div className="grid gap-3">
          {invoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onView={onViewInvoice}
              onEdit={onEditInvoice}
              onDelete={onDeleteInvoice}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoicesList;
