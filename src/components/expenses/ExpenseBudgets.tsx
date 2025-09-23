import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useExpenseBudgets } from '@/hooks/useExpenses';

const ExpenseBudgets = () => {
  const { data: budgets, isLoading } = useExpenseBudgets();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getBudgetStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'exceeded':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'completed':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'exceeded':
        return 'destructive';
      case 'completed':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 70) return 'bg-green-500';
    if (percentage <= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Budget Management</h2>
          <p className="text-muted-foreground">
            Track and manage your expense budgets
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {budgets && budgets.length > 0 ? (
        <div className="grid gap-4">
          {budgets.map((budget) => {
            const percentage = budget.budget_amount > 0 
              ? (budget.spent_amount / budget.budget_amount) * 100 
              : 0;
            const isOverBudget = percentage > 100;
            
            return (
              <Card key={budget.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      {getBudgetStatusIcon(budget.status)}
                      {budget.expense_categories?.name || 'Unknown Category'}
                    </CardTitle>
                    <Badge variant={getBudgetStatusColor(budget.status)}>
                      {budget.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Spent: ${budget.spent_amount.toFixed(2)}</span>
                      <span>Budget: ${budget.budget_amount.toFixed(2)}</span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className="h-2"
                    />
                    <div className="flex justify-between items-center text-sm">
                      <span className={`font-medium ${
                        isOverBudget ? 'text-red-600' : 'text-muted-foreground'
                      }`}>
                        {percentage.toFixed(1)}% used
                      </span>
                      {isOverBudget && (
                        <span className="text-red-600 font-medium">
                          ${(budget.spent_amount - budget.budget_amount).toFixed(2)} over budget
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Period</p>
                      <p className="font-medium">{budget.period_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className={`font-medium ${
                        budget.budget_amount - budget.spent_amount >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        ${(budget.budget_amount - budget.spent_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {budget.status === 'exceeded' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-red-800">Budget Exceeded</p>
                          <p className="text-red-600">
                            Consider reviewing your expenses for this category to get back on track.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No Budgets Yet</h3>
                <p className="text-muted-foreground">
                  Create your first budget to start tracking expenses
                </p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Budget
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpenseBudgets;