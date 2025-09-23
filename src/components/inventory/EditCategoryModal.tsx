import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useUpdateInventoryCategory, type InventoryCategory } from '@/hooks/useInventory';

interface EditCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: InventoryCategory | null;
}

const EditCategoryModal = ({ open, onOpenChange, category }: EditCategoryModalProps) => {
  const { register, handleSubmit, reset } = useForm();
  const updateCategory = useUpdateInventoryCategory();

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || '',
        color: category.color || '#6366f1',
      });
    }
  }, [category, reset]);

  const onSubmit = async (data: any) => {
    if (!category) return;
    try {
      await updateCategory.mutateAsync({
        id: category.id,
        updates: {
          name: data.name,
          description: data.description || null,
          color: data.color || '#6366f1',
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        {category && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input {...register('name', { required: true })} />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea {...register('description')} />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input type="color" {...register('color')} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCategory.isPending}>
                {updateCategory.isPending ? 'Updating…' : 'Update Category'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
