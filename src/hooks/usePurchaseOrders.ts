import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PurchaseOrder {
  id: string;
  user_id: string;
  order_number: string;
  supplier_name: string;
  supplier_email?: string;
  order_date: string;
  expected_delivery_date?: string;
  received_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
  quantity_received?: number;
  created_at: string;
}

export const usePurchaseOrders = () => {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
};

export const usePurchaseOrderItems = (orderId: string) => {
  return useQuery({
    queryKey: ['purchase-order-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as PurchaseOrderItem[];
    },
    enabled: !!orderId,
  });
};

export const useGeneratePurchaseOrderNumber = () => {
  return useQuery({
    queryKey: ['generate-purchase-order-number'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastOrder = data[0];
        const match = lastOrder.order_number.match(/PO-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      return `PO-${nextNumber.toString().padStart(6, '0')}`;
    },
  });
};

interface CreatePurchaseOrderData {
  order: Omit<PurchaseOrder, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  items: Omit<PurchaseOrderItem, 'id' | 'order_id' | 'created_at'>[];
}

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order, items }: CreatePurchaseOrderData) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create the purchase order with user_id
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({ ...order, user_id: user.id })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create the purchase order items
      const itemsWithOrderId = items.map(item => ({
        ...item,
        order_id: orderData.id,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsWithOrderId);

      if (itemsError) throw itemsError;

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['generate-purchase-order-number'] });
    },
    onError: (error) => {
      console.error('Error creating purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to create purchase order. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePurchaseOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (error) => {
      console.error('Error updating purchase order status:', error);
      toast({
        title: "Error",
        description: "Failed to update purchase order status. Please try again.",
        variant: "destructive",
      });
    },
  });
};