import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { convertCurrency, formatCurrencyWithCode } from "@/utils/currencyConverter";
import { useUserSettings } from "@/hooks/useUserSettings";

export interface FinancialAnalytics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyTrends: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  expensesByCategory: {
    category: string;
    amount: number;
    color: string;
  }[];
  revenueVsExpenses: {
    name: string;
    revenue: number;
    expenses: number;
  }[];
  cashFlow: {
    totalIncome: number;
    totalOutflow: number;
    netCashFlow: number;
  };
  pendingPayments: number;
  outstandingExpenses: number;
}

export const useFinancialAnalytics = (dateRange = 12) => {
  const { user } = useAuth();
  const { getCurrency } = useUserSettings();
  
  return useQuery({
    queryKey: ['financial_analytics', user?.id, dateRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subMonths(endDate, dateRange);
      
      // Fetch invoices (revenue) - exclude deleted ones (manual invoices only, not POS-generated)
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('total_amount, payment_status, paid_amount, issue_date, status, id')
        .eq('user_id', user?.id)
        .neq('status', 'deleted')
        .gte('issue_date', format(startDate, 'yyyy-MM-dd'))
        .lte('issue_date', format(endDate, 'yyyy-MM-dd'));
      
      if (invoicesError) throw invoicesError;
      
      // Filter out POS-generated invoices by checking pos_sales table
      const { data: posInvoices, error: posError } = await supabase
        .from('pos_sales')
        .select('invoice_id')
        .eq('user_id', user?.id)
        .not('invoice_id', 'is', null);
      
      if (posError) throw posError;
      
      const posInvoiceIds = new Set(posInvoices?.map(sale => sale.invoice_id) || []);
      const filteredInvoices = invoices?.filter(invoice => !posInvoiceIds.has(invoice.id)) || [];
      
      // Fetch expenses with currency conversion
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, currency, category, expense_date, status')
        .eq('user_id', user?.id)
        .eq('status', 'approved')
        .gte('expense_date', format(startDate, 'yyyy-MM-dd'))
        .lte('expense_date', format(endDate, 'yyyy-MM-dd'));
      
      if (expensesError) throw expensesError;
      
      // Fetch expense categories for colors
      const { data: categories, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('name, color')
        .eq('user_id', user?.id);
      
      if (categoriesError) throw categoriesError;
      
      // Get user's preferred currency for calculations
      const baseCurrency = getCurrency();
      
      // Calculate totals with currency conversion (using filtered invoices)
      const totalRevenue = filteredInvoices.reduce((sum, invoice) => {
        return sum + (invoice.payment_status === 'paid' ? invoice.total_amount : invoice.paid_amount || 0);
      }, 0);
      
      const totalExpenses = expenses?.reduce((sum, expense) => {
        const convertedAmount = convertCurrency(expense.amount, expense.currency || 'USD', baseCurrency);
        return sum + convertedAmount;
      }, 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      // Calculate monthly trends
      const monthlyTrends = [];
      for (let i = dateRange - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(endDate, i));
        const monthEnd = endOfMonth(subMonths(endDate, i));
        const monthName = format(monthStart, 'MMM yyyy');
        
        const monthRevenue = filteredInvoices.filter(invoice => {
          const issueDate = new Date(invoice.issue_date);
          return issueDate >= monthStart && issueDate <= monthEnd;
        }).reduce((sum, invoice) => {
          return sum + (invoice.payment_status === 'paid' ? invoice.total_amount : invoice.paid_amount || 0);
        }, 0);
        
        const monthExpenses = expenses?.filter(expense => {
          const expenseDate = new Date(expense.expense_date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        }).reduce((sum, expense) => {
          const convertedAmount = convertCurrency(expense.amount, expense.currency || 'USD', baseCurrency);
          return sum + convertedAmount;
        }, 0) || 0;
        
        monthlyTrends.push({
          month: monthName,
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
        });
      }
      
      // Calculate expenses by category
      const categoryMap = new Map();
      const colorMap = new Map(categories?.map(cat => [cat.name, cat.color]) || []);
      
      expenses?.forEach(expense => {
        const convertedAmount = convertCurrency(expense.amount, expense.currency || 'USD', baseCurrency);
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + convertedAmount);
      });
      
      const expensesByCategory = Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category,
        amount,
        color: colorMap.get(category) || '#6366f1',
      }));
      
      // Calculate pending payments and outstanding expenses (using filtered invoices)
      const pendingPayments = filteredInvoices.filter(invoice => 
        invoice.payment_status === 'unpaid' || invoice.payment_status === 'partial'
      ).reduce((sum, invoice) => sum + (invoice.total_amount - (invoice.paid_amount || 0)), 0);
      
      const outstandingExpenses = expenses?.filter(expense => 
        expense.status === 'pending'
      ).reduce((sum, expense) => {
        const convertedAmount = convertCurrency(expense.amount, expense.currency || 'USD', baseCurrency);
        return sum + convertedAmount;
      }, 0) || 0;
      
      // Revenue vs Expenses comparison
      const revenueVsExpenses = [
        { name: 'Revenue', revenue: totalRevenue, expenses: 0 },
        { name: 'Expenses', revenue: 0, expenses: totalExpenses },
      ];
      
      const analytics: FinancialAnalytics = {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        monthlyTrends,
        expensesByCategory,
        revenueVsExpenses,
        cashFlow: {
          totalIncome: totalRevenue,
          totalOutflow: totalExpenses,
          netCashFlow: totalRevenue - totalExpenses,
        },
        pendingPayments,
        outstandingExpenses,
      };
      
      return analytics;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};