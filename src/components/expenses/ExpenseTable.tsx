import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeleteExpense, type Expense } from '@/hooks/useExpenses';
import { currencies } from '@/constants/currencies';

interface ExpenseTableProps {
  expenses: Expense[];
}

const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const deleteExpense = useDeleteExpense();

  // Get unique categories for filter
  const categories = Array.from(new Set(expenses.map(expense => expense.category)));

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'default';
    }
  };

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense.mutateAsync(expenseId);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Expense Records</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 w-48 h-8 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-24 h-8 text-xs bg-background border-input">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32 h-8 text-xs bg-background border-input">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="h-9 text-xs font-semibold text-muted-foreground">Date</TableHead>
                <TableHead className="h-9 text-xs font-semibold text-muted-foreground">Description</TableHead>
                <TableHead className="h-9 text-xs font-semibold text-muted-foreground">Category</TableHead>
                <TableHead className="h-9 text-xs font-semibold text-muted-foreground">Vendor</TableHead>
                <TableHead className="h-9 text-xs font-semibold text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="h-9 text-xs font-semibold text-muted-foreground">Method</TableHead>
                <TableHead className="h-9 text-xs font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="h-9 w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    <div className="space-y-2">
                      <p>No expenses found</p>
                      {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                        <p className="text-xs">Try adjusting your filters</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="py-2">
                      <div className="text-sm font-medium">
                        {format(new Date(expense.expense_date), 'MMM dd')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(expense.expense_date), 'yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="max-w-48">
                        <div className="text-sm font-medium truncate">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-xs text-muted-foreground truncate">
                            {expense.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="py-2 text-sm">
                      {expense.vendor_name ? (
                        <div className="max-w-24 truncate">{expense.vendor_name}</div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="text-sm font-bold">
                        {getCurrencySymbol(expense.currency || 'USD')}{expense.amount.toFixed(2)}
                      </div>
                      {expense.tax_amount && expense.tax_amount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          +{getCurrencySymbol(expense.currency || 'USD')}{expense.tax_amount.toFixed(2)} tax
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="text-xs text-muted-foreground">
                        {expense.payment_method?.replace('_', ' ') || 'Cash'}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant={getStatusColor(expense.status)} className="text-xs">
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem className="text-xs">
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs">
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-xs text-red-600"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseTable;