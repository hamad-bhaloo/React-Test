import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface InventoryCategory {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryProduct {
  id: string;
  user_id: string;
  category_id?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  unit_price: number;
  cost_price: number;
  quantity_in_stock: number;
  minimum_stock_level: number;
  maximum_stock_level?: number;
  unit_of_measure: string;
  tax_rate: number;
  image_url?: string;
  is_active: boolean;
  track_inventory: boolean;
  allow_backorder: boolean;
  created_at: string;
  updated_at: string;
  category?: InventoryCategory;
}

export interface InventoryTransaction {
  id: string;
  user_id: string;
  product_id: string;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  transaction_date: string;
  created_at: string;
  product?: InventoryProduct;
}

// Hook to fetch inventory categories
export const useInventoryCategories = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['inventory-categories', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as InventoryCategory[];
    },
    enabled: !!user?.id,
  });
};

// Hook to fetch inventory products
export const useInventoryProducts = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['inventory-products', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('inventory_products')
        .select(`
          *,
          category:inventory_categories(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as InventoryProduct[];
    },
    enabled: !!user?.id,
  });
};

// Hook to fetch inventory transactions
export const useInventoryTransactions = (productId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['inventory-transactions', user?.id, productId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          product:inventory_products(name, sku)
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as InventoryTransaction[];
    },
    enabled: !!user?.id,
  });
};

// Hook to create inventory category
export const useCreateInventoryCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (category: Omit<InventoryCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('inventory_categories')
        .insert({
          ...category,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create category: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to create inventory product
export const useCreateInventoryProduct = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (product: Omit<InventoryProduct, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('inventory_products')
        .insert({
          ...product,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to update product stock
export const useUpdateProductStock = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
      transactionType,
      unitCost,
      notes,
      referenceType,
      referenceId,
    }: {
      productId: string;
      quantity: number;
      transactionType: 'in' | 'out' | 'adjustment';
      unitCost?: number;
      notes?: string;
      referenceType?: string;
      referenceId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('inventory_transactions')
        .insert({
          user_id: user.id,
          product_id: productId,
          transaction_type: transactionType,
          quantity,
          unit_cost: unitCost,
          total_cost: unitCost ? unitCost * quantity : undefined,
          reference_type: referenceType,
          reference_id: referenceId,
          notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update stock: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to update inventory product
export const useUpdateInventoryProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryProduct> }) => {
      const { data, error } = await supabase
        .from('inventory_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to delete inventory product
export const useDeleteInventoryProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_products')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to update inventory category
export const useUpdateInventoryCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryCategory> }) => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update category: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to delete inventory category (soft delete)
export const useDeleteInventoryCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_categories')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete category: " + error.message,
        variant: "destructive",
      });
    },
  });
};