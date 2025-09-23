import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';

const ExpenseAnalytics = () => {
  const { data: analytics, isLoading } = useFinancialAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue vs Expenses Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses Trend</CardTitle>
          <CardDescription>
            Monthly comparison of income and expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.monthlyTrends}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#10b981"
                fill="url(#revenue)"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="#ef4444"
                fill="url(#expenses)"
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>
              Breakdown of expenses by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, amount, percent }) => 
                    `${category}: $${amount.toFixed(0)} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {analytics.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
            <CardDescription>
              Monthly profit/loss over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toFixed(2)}`, 
                    value >= 0 ? 'Profit' : 'Loss'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Summary</CardTitle>
          <CardDescription>
            Overview of cash inflows and outflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                ${analytics.cashFlow.totalIncome.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Outflow</p>
              <p className="text-2xl font-bold text-red-600">
                ${analytics.cashFlow.totalOutflow.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium text-muted-foreground">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${
                analytics.cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${analytics.cashFlow.netCashFlow.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Indicators */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>
              Outstanding invoice amounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              ${analytics.pendingPayments.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Money yet to be received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding Expenses</CardTitle>
            <CardDescription>
              Pending expense approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              ${analytics.outstandingExpenses.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Expenses awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpenseAnalytics;