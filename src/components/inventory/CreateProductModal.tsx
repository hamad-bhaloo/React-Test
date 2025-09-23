import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useCreateInventoryProduct, useInventoryCategories } from '@/hooks/useInventory';
import { useUserSettings } from '@/hooks/useUserSettings';
import { currencies } from '@/constants/currencies';

interface CreateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateProductModal = ({ open, onOpenChange }: CreateProductModalProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const { data: categories } = useInventoryCategories();
  const createProduct = useCreateInventoryProduct();
  const { getCurrency } = useUserSettings();
  
  const userCurrency = getCurrency();
  const currencySymbol = currencies.find(c => c.code === userCurrency)?.symbol || userCurrency;

  const onSubmit = async (data: any) => {
    try {
      await createProduct.mutateAsync({
        ...data,
        unit_price: Number(data.unit_price),
        cost_price: Number(data.cost_price),
        quantity_in_stock: Number(data.quantity_in_stock),
        minimum_stock_level: Number(data.minimum_stock_level),
        tax_rate: Number(data.tax_rate) || 0,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input {...register('name', { required: true })} />
          </div>
          
          <div>
            <Label htmlFor="category_id">Category</Label>
            <Select onValueChange={(value) => setValue('category_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input {...register('sku')} />
            </div>
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input {...register('barcode')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit_price">Unit Price ({currencySymbol})</Label>
              <Input {...register('unit_price', { required: true })} type="number" step="0.01" />
            </div>
            <div>
              <Label htmlFor="cost_price">Cost Price ({currencySymbol})</Label>
              <Input {...register('cost_price', { required: true })} type="number" step="0.01" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity_in_stock">Initial Stock</Label>
              <Input {...register('quantity_in_stock')} type="number" defaultValue="0" />
            </div>
            <div>
              <Label htmlFor="minimum_stock_level">Min Stock Level</Label>
              <Input {...register('minimum_stock_level')} type="number" defaultValue="5" />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea {...register('description')} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProduct.isPending}>
              {createProduct.isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProductModal;