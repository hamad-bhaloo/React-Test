import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useUpdateProductStock, useInventoryProducts } from '@/hooks/useInventory';

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}

const StockAdjustmentModal = ({ open, onOpenChange, productId }: StockAdjustmentModalProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const { data: products } = useInventoryProducts();
  const updateStock = useUpdateProductStock();

  const product = products?.find(p => p.id === productId);
  const transactionType = watch('transactionType');

  const onSubmit = async (data: any) => {
    try {
      await updateStock.mutateAsync({
        productId,
        quantity: Number(data.quantity),
        transactionType: data.transactionType,
        unitCost: data.unitCost ? Number(data.unitCost) : undefined,
        notes: data.notes,
        referenceType: 'adjustment',
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to adjust stock:', error);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock - {product.name}</DialogTitle>
        </DialogHeader>
        <div className="mb-4 p-3 bg-muted rounded">
          <p className="text-sm">Current Stock: <span className="font-bold">{product.quantity_in_stock} {product.unit_of_measure}</span></p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="transactionType">Adjustment Type</Label>
            <Select onValueChange={(value) => setValue('transactionType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Stock In (Add)</SelectItem>
                <SelectItem value="out">Stock Out (Remove)</SelectItem>
                <SelectItem value="adjustment">Set Exact Quantity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">
              {transactionType === 'adjustment' ? 'New Quantity' : 'Quantity'}
            </Label>
            <Input {...register('quantity', { required: true })} type="number" />
          </div>

          <div>
            <Label htmlFor="unitCost">Unit Cost (Optional)</Label>
            <Input {...register('unitCost')} type="number" step="0.01" />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea {...register('notes')} placeholder="Reason for adjustment..." />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateStock.isPending}>
              {updateStock.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentModal;