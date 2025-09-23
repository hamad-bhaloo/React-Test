import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types for POS operations
export interface POSSale {
  id: string;
  user_id: string;
  customer_id?: string;
  sale_number: string;
  sale_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
  payment_status: string;
  currency: string;
  notes?: string;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
  items?: POSSaleItem[];
  customer?: {
    id: string;
    name: string;
  };
}

export interface POSSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
}

// Hook to fetch POS sales
export const usePOSSales = (limit = 50) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['pos-sales', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('pos_sales')
        .select(`
          *,
          items:pos_sale_items(*),
          customer:clients(id, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as POSSale[];
    },
    enabled: !!user?.id,
  });
};

// Hook to get POS stats for today
export const usePOSStats = (date?: string) => {
  const { user } = useAuth();
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['pos-stats', user?.id, targetDate],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('pos_sales')
        .select('total_amount, payment_method, currency')
        .eq('user_id', user.id)
        .gte('sale_date', `${targetDate}T00:00:00`)
        .lt('sale_date', `${targetDate}T23:59:59`);
      
      if (error) throw error;
      
      const totalSales = data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const salesCount = data?.length || 0;
      const averageTicket = salesCount > 0 ? totalSales / salesCount : 0;
      
      // Group by payment method
      const paymentMethods = data?.reduce((acc: any, sale) => {
        acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1;
        return acc;
      }, {}) || {};
      
      return {
        totalSales,
        salesCount,
        averageTicket,
        paymentMethods,
      };
    },
    enabled: !!user?.id,
  });
};

// Hook to generate next sale number
export const useGenerateSaleNumber = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['generate-sale-number', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('pos_sales')
        .select('sale_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = data[0].sale_number;
        const match = lastNumber.match(/POS-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      return `POS-${String(nextNumber).padStart(4, '0')}`;
    },
    enabled: !!user?.id,
  });
};

// Hook to create a new POS sale
export const useCreatePOSSale = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { sale: Omit<POSSale, 'id' | 'user_id' | 'created_at' | 'updated_at'>; items: CartItem[] }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { sale, items } = data;

      // Create the sale
      const { data: createdSale, error: saleError } = await supabase
        .from('pos_sales')
        .insert({
          ...sale,
          user_id: user.id,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = items.map(item => ({
        ...item,
        sale_id: createdSale.id,
      }));

      const { error: itemsError } = await supabase
        .from('pos_sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Create inventory transactions for each item
      for (const item of items) {
        const { error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert({
            user_id: user.id,
            product_id: item.product_id,
            transaction_type: 'sale',
            quantity: -item.quantity, // Negative for outgoing inventory
            unit_cost: item.unit_price,
            total_cost: item.line_total,
            reference_type: 'pos_sale',
            reference_id: createdSale.id,
            notes: `POS Sale ${createdSale.sale_number}`,
          });

        if (transactionError) throw transactionError;

        // Get current product to update stock
        const { data: product, error: productError } = await supabase
          .from('inventory_products')
          .select('quantity_in_stock')
          .eq('id', item.product_id)
          .single();

        if (productError) throw productError;

        // Update product stock
        const { error: stockError } = await supabase
          .from('inventory_products')
          .update({
            quantity_in_stock: product.quantity_in_stock - item.quantity
          })
          .eq('id', item.product_id);

        if (stockError) throw stockError;
      }

      return createdSale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-sales'] });
      queryClient.invalidateQueries({ queryKey: ['pos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['generate-sale-number'] });
      
      toast({
        title: "Success",
        description: "Sale completed successfully",
      });
    },
    onError: (error) => {
      console.error('POS sale error:', error);
      toast({
        title: "Error",
        description: "Failed to complete sale: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Note: Invoice creation from POS sales has been removed for complete separation