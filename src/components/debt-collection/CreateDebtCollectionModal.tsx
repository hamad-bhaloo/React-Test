import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateDebtCollection, useOverdueInvoices } from '@/hooks/useDebtCollections';

interface CreateDebtCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overdueInvoices: any[];
}

export const CreateDebtCollectionModal = ({ 
  open, 
  onOpenChange, 
  overdueInvoices 
}: CreateDebtCollectionModalProps) => {
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [nextActionDate, setNextActionDate] = useState<Date>();
  
  const createMutation = useCreateDebtCollection();
  const { data: freshOverdueInvoices = [], refetch: refetchOverdue } = useOverdueInvoices();
  
  // Refetch overdue invoices when modal opens
  useEffect(() => {
    if (open) {
      refetchOverdue();
    }
  }, [open, refetchOverdue]);
  
  // Use fresh data when available
  const invoicesToUse = freshOverdueInvoices.length > 0 ? freshOverdueInvoices : overdueInvoices;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoice) return;

    try {
      await createMutation.mutateAsync({
        invoice_id: selectedInvoice,
        priority,
        status,
        collection_notes: collectionNotes || null,
        next_action_date: nextActionDate ? format(nextActionDate, 'yyyy-MM-dd') : null,
        contact_attempts: 0,
        amount_collected: 0,
        collection_fees: 0,
      });

      // Reset form
      setSelectedInvoice('');
      setPriority('medium');
      setStatus('pending');
      setCollectionNotes('');
      setNextActionDate(undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating debt collection:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Debt Collection Case</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice">Select Overdue Invoice *</Label>
            <Select value={selectedInvoice} onValueChange={setSelectedInvoice} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose an overdue invoice" />
              </SelectTrigger>
              <SelectContent>
                {invoicesToUse.filter(invoice => invoice.id && invoice.id.trim() !== '').map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    #{invoice.invoice_number} - {invoice.clients?.name} - ${invoice.total_amount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Next Action Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !nextActionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nextActionDate ? format(nextActionDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={nextActionDate}
                  onSelect={setNextActionDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Collection Notes</Label>
            <Textarea
              id="notes"
              value={collectionNotes}
              onChange={(e) => setCollectionNotes(e.target.value)}
              placeholder="Enter initial notes about this collection case..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedInvoice || createMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};