import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  payment_method?: string;
  receipt_url?: string;
  vendor_name?: string;
  tax_amount?: number;
  is_recurring?: boolean;
  recurring_frequency?: string;
  recurring_end_date?: string;
  tags?: string[];
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  budget_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseBudget {
  id: string;
  user_id: string;
  category_id: string;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  budget_amount: number;
  spent_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'exceeded' | 'completed';
  created_at: string;
  updated_at: string;
  expense_categories?: ExpenseCategory;
}

export const useExpenses = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user?.id,
  });
};

export const useExpenseCategories = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['expense_categories', user?.id],
    queryFn: async () => {
      // First try to get existing categories
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      // If no categories exist, initialize default ones
      if (!data || data.length === 0) {
        try {
          await supabase.functions.invoke('initialize-expense-categories');
          // Refetch categories after initialization
          const { data: newData, error: newError } = await supabase
            .from('expense_categories')
            .select('*')
            .eq('user_id', user?.id)
            .eq('is_active', true)
            .order('name');
          
          if (newError) throw newError;
          return newData as ExpenseCategory[];
        } catch (initError) {
          console.error('Failed to initialize categories:', initError);
          return data as ExpenseCategory[];
        }
      }
      
      return data as ExpenseCategory[];
    },
    enabled: !!user?.id,
  });
};

export const useExpenseBudgets = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['expense_budgets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_budgets')
        .select(`
          *,
          expense_categories:category_id (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ExpenseBudget[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (expenseData: Omit<Partial<Expense>, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { category: string; description: string; amount: number; expense_date: string; currency: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense_budgets'] });
      toast.success("Expense created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create expense: ${error.message}`);
    },
  });
};

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (categoryData: Omit<Partial<ExpenseCategory>, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { name: string }) => {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert({
          ...categoryData,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_categories'] });
      toast.success("Category created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense_budgets'] });
      toast.success("Expense deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete expense: ${error.message}`);
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense_budgets'] });
      toast.success("Expense updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update expense: ${error.message}`);
    },
  });
};