import React, { useState } from 'react';
import { Plus, TrendingDown, AlertCircle, DollarSign, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpenses, useExpenseCategories, useExpenseBudgets } from '@/hooks/useExpenses';
import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';
import CreateExpenseModal from '@/components/expenses/CreateExpenseModal';
import ExpenseTableWithPagination from '@/components/expenses/ExpenseTableWithPagination';
import ExpenseAnalytics from '@/components/expenses/ExpenseAnalytics';
import ExpenseBudgets from '@/components/expenses/ExpenseBudgets';
import ExpenseInsights from '@/components/expenses/ExpenseInsights';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { convertCurrency, formatCurrencyWithCode } from '@/utils/currencyConverter';
import { useUserSettings } from '@/hooks/useUserSettings';

const ExpensesPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: categories } = useExpenseCategories();
  const { data: budgets } = useExpenseBudgets();
  const { data: analytics } = useFinancialAnalytics();
  const { getCurrency } = useUserSettings();

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy'),
      date
    };
  });

  // Filter data by selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const monthlyExpenses = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    return expenseDate >= monthStart && expenseDate <= monthEnd && expense.status === 'approved';
  }) || [];

  const baseCurrency = getCurrency();
  const monthlyTotal = monthlyExpenses.reduce((sum, expense) => {
    const convertedAmount = convertCurrency(expense.amount, expense.currency || 'USD', baseCurrency);
    return sum + convertedAmount;
  }, 0);
  const pendingExpenses = expenses?.filter(expense => expense.status === 'pending').length || 0;
  const exceededBudgets = budgets?.filter(budget => budget.status === 'exceeded').length || 0;

  // Calculate month-over-month change with currency conversion
  const prevMonth = subMonths(selectedMonth, 1);
  const prevMonthStart = startOfMonth(prevMonth);
  const prevMonthEnd = endOfMonth(prevMonth);
  
  const prevMonthExpenses = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    return expenseDate >= prevMonthStart && expenseDate <= prevMonthEnd && expense.status === 'approved';
  }) || [];
  
  const prevMonthTotal = prevMonthExpenses.reduce((sum, expense) => {
    const convertedAmount = convertCurrency(expense.amount, expense.currency || 'USD', baseCurrency);
    return sum + convertedAmount;
  }, 0);
  const monthlyChange = prevMonthTotal > 0 ? ((monthlyTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;

  if (expensesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header matching other pages */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground">
            Track your business expenses and manage budgets
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={format(selectedMonth, 'yyyy-MM')} 
              onValueChange={(value) => setSelectedMonth(new Date(value + '-01'))}
            >
              <SelectTrigger className="w-[180px] bg-background border-input">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-700">Monthly Expenses</p>
                <p className="text-lg font-bold text-emerald-900">
                  {formatCurrencyWithCode(monthlyTotal, baseCurrency)}
                </p>
                <p className="text-xs text-emerald-600">
                  {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
                </p>
              </div>
              <TrendingDown className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Monthly Revenue</p>
                <p className="text-lg font-bold text-blue-900">
                  ${(analytics?.monthlyTrends?.find(t => t.month === format(selectedMonth, 'yyyy-MM'))?.revenue || 0).toFixed(2)}
                </p>
                <p className="text-xs text-blue-600">
                  {format(selectedMonth, 'MMM yyyy')}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-violet-700">Monthly Profit</p>
                <p className="text-lg font-bold text-violet-900">
                  ${((analytics?.monthlyTrends?.find(t => t.month === format(selectedMonth, 'yyyy-MM'))?.revenue || 0) - monthlyTotal).toFixed(2)}
                </p>
                <p className="text-xs text-violet-600">
                  Net this month
                </p>
              </div>
              <TrendingDown className="h-6 w-6 text-violet-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-700">Pending</p>
                <p className="text-lg font-bold text-amber-900">{pendingExpenses}</p>
                <p className="text-xs text-amber-600">
                  Awaiting approval
                </p>
              </div>
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700">Budget Alerts</p>
                <p className="text-lg font-bold text-red-900">{exceededBudgets}</p>
                <p className="text-xs text-red-600">
                  Exceeded
                </p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700">Total Count</p>
                <p className="text-lg font-bold text-gray-900">{monthlyExpenses.length}</p>
                <p className="text-xs text-gray-600">
                  This month
                </p>
              </div>
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Financial Summary - {format(selectedMonth, 'MMMM yyyy')}
              <Badge variant={analytics.netProfit >= 0 ? "default" : "destructive"}>
                {analytics.netProfit >= 0 ? 'Profitable' : 'Loss'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(analytics?.monthlyTrends?.find(t => t.month === format(selectedMonth, 'yyyy-MM'))?.revenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ${(analytics?.monthlyTrends?.find(t => t.month === format(selectedMonth, 'yyyy-MM'))?.expenses || monthlyTotal).toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Monthly Net Profit</p>
                <p className={`text-2xl font-bold ${((analytics?.monthlyTrends?.find(t => t.month === format(selectedMonth, 'yyyy-MM'))?.revenue || 0) - monthlyTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${((analytics?.monthlyTrends?.find(t => t.month === format(selectedMonth, 'yyyy-MM'))?.revenue || 0) - monthlyTotal).toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className={`text-2xl font-bold ${analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseTableWithPagination expenses={monthlyExpenses} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ExpenseAnalytics />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <ExpenseBudgets />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <ExpenseInsights />
        </TabsContent>
      </Tabs>

      <CreateExpenseModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
};

export default ExpensesPage;