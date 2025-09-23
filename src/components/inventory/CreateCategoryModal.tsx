import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useCreateInventoryCategory } from '@/hooks/useInventory';

interface CreateCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateCategoryModal = ({ open, onOpenChange }: CreateCategoryModalProps) => {
  const { register, handleSubmit, reset } = useForm();
  const createCategory = useCreateInventoryCategory();

  const onSubmit = async (data: any) => {
    try {
      await createCategory.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
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
            <Input {...register('color')} type="color" defaultValue="#6366f1" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryModal;