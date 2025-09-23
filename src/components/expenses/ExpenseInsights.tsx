import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  TrendingDown, 
  AlertCircle, 
  DollarSign,
  Target,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';

const ExpenseInsights = () => {
  const { data: analytics } = useFinancialAnalytics();

  // Generate AI-powered insights based on financial data
  const generateInsights = () => {
    if (!analytics) return [];

    const insights = [];

    // Profit margin analysis
    if (analytics.profitMargin < 20) {
      insights.push({
        id: 'profit-margin',
        type: 'cost_reduction',
        priority: 'high',
        title: 'Low Profit Margin Alert',
        description: `Your profit margin is ${analytics.profitMargin.toFixed(1)}%, which is below the recommended 20%. Consider reducing expenses or increasing revenue.`,
        potentialSavings: analytics.totalExpenses * 0.1,
        actionItems: [
          'Review and negotiate better rates with suppliers',
          'Identify and eliminate unnecessary expenses',
          'Consider raising prices for your services',
          'Look for more cost-effective alternatives'
        ],
        icon: AlertCircle,
        color: 'destructive'
      });
    }

    // High expense categories
    const topExpenseCategory = analytics.expensesByCategory[0];
    if (topExpenseCategory && topExpenseCategory.amount > analytics.totalExpenses * 0.3) {
      insights.push({
        id: 'high-category',
        type: 'category_optimization',
        priority: 'medium',
        title: `High ${topExpenseCategory.category} Expenses`,
        description: `${topExpenseCategory.category} accounts for ${((topExpenseCategory.amount / analytics.totalExpenses) * 100).toFixed(1)}% of your total expenses.`,
        potentialSavings: topExpenseCategory.amount * 0.15,
        actionItems: [
          `Review all ${topExpenseCategory.category} expenses for optimization`,
          'Compare prices from different vendors',
          'Consider bulk purchasing or annual contracts',
          'Implement approval workflows for this category'
        ],
        icon: TrendingDown,
        color: 'secondary'
      });
    }

    // Positive cash flow insights
    if (analytics.netProfit > 0) {
      insights.push({
        id: 'positive-cash',
        type: 'growth_opportunity',
        priority: 'low',
        title: 'Strong Financial Position',
        description: `Great job! You're maintaining a positive cash flow of $${analytics.netProfit.toFixed(2)}. Consider reinvesting for growth.`,
        potentialSavings: 0,
        actionItems: [
          'Consider investing in business growth',
          'Build an emergency fund',
          'Upgrade equipment or technology',
          'Expand your service offerings'
        ],
        icon: CheckCircle,
        color: 'default'
      });
    }

    // Seasonal spending patterns
    const monthlyVariation = analytics.monthlyTrends.map(m => m.expenses);
    const avgExpenses = monthlyVariation.reduce((a, b) => a + b, 0) / monthlyVariation.length;
    const hasHighVariation = monthlyVariation.some(exp => Math.abs(exp - avgExpenses) > avgExpenses * 0.3);
    
    if (hasHighVariation) {
      insights.push({
        id: 'seasonal-pattern',
        type: 'trend_analysis',
        priority: 'medium',
        title: 'Irregular Spending Patterns',
        description: 'Your monthly expenses vary significantly. Consider implementing better budget planning.',
        potentialSavings: avgExpenses * 0.05,
        actionItems: [
          'Create monthly expense budgets',
          'Set up automated alerts for overspending',
          'Plan for seasonal expense variations',
          'Implement expense approval workflows'
        ],
        icon: Calendar,
        color: 'secondary'
      });
    }

    // Pending payments impact
    if (analytics.pendingPayments > analytics.totalExpenses * 0.2) {
      insights.push({
        id: 'pending-payments',
        type: 'cash_flow',
        priority: 'high',
        title: 'High Pending Payments',
        description: `You have $${analytics.pendingPayments.toFixed(2)} in pending payments, which could impact cash flow.`,
        potentialSavings: 0,
        actionItems: [
          'Follow up on overdue invoices',
          'Implement automated payment reminders',
          'Offer early payment discounts',
          'Consider factoring or invoice financing'
        ],
        icon: DollarSign,
        color: 'destructive'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
      </div>
      
      <p className="text-muted-foreground">
        Smart recommendations to optimize your expenses and improve profitability
      </p>

      {insights.length > 0 ? (
        <div className="grid gap-4">
          {insights.map((insight) => {
            const IconComponent = insight.icon;
            return (
              <Card key={insight.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getPriorityColor(insight.priority)}>
                            {insight.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            {insight.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {insight.potentialSavings > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Potential Savings</p>
                        <p className="text-lg font-bold text-green-600">
                          ${insight.potentialSavings.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{insight.description}</p>
                  
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Recommended Actions
                    </h4>
                    <ul className="space-y-1">
                      {insight.actionItems.map((action, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm">
                      Mark as Done
                    </Button>
                    <Button variant="outline" size="sm">
                      Remind Me Later
                    </Button>
                  </div>
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
                <Lightbulb className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No Insights Available</h3>
                <p className="text-muted-foreground">
                  Add more expense data to get personalized insights and recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpenseInsights;