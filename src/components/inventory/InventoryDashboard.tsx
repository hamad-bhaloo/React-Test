import React, { useState } from 'react';
import { Package, Plus, Search, AlertTriangle, TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useInventoryProducts, useInventoryCategories, useInventoryTransactions, useDeleteInventoryProduct, useDeleteInventoryCategory, type InventoryProduct, type InventoryCategory } from '@/hooks/useInventory';
import { formatCurrencyWithCode } from '@/utils/currencyConverter';
import { useUserSettings } from '@/hooks/useUserSettings';
import CreateProductModal from './CreateProductModal';
import CreateCategoryModal from './CreateCategoryModal';
import StockAdjustmentModal from './StockAdjustmentModal';

const InventoryDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const { data: products, isLoading: productsLoading } = useInventoryProducts();
  const { data: categories } = useInventoryCategories();
  const { data: transactions } = useInventoryTransactions();
  const deleteProductMutation = useDeleteInventoryProduct();
  const { getCurrency } = useUserSettings();

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const lowStockProducts = products?.filter(p => p.quantity_in_stock <= p.minimum_stock_level) || [];
  const outOfStockProducts = products?.filter(p => p.quantity_in_stock === 0) || [];
  const totalInventoryValue = products?.reduce((sum, p) => sum + (p.quantity_in_stock * p.cost_price), 0) || 0;

  const getStockStatus = (product: any) => {
    if (product.quantity_in_stock === 0) return 'out-of-stock';
    if (product.quantity_in_stock <= product.minimum_stock_level) return 'low-stock';
    return 'in-stock';
  };

  const getStockBadge = (product: any) => {
    const status = getStockStatus(product);
    switch (status) {
      case 'out-of-stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'low-stock':
        return <Badge variant="secondary">Low Stock</Badge>;
      default:
        return <Badge variant="default">In Stock</Badge>;
    }
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards (Compact) */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 max-h-[20vh]">
        <Card>
          <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-semibold leading-tight">{products?.length || 0}</div>
            <p className="text-[11px] text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-semibold leading-tight text-orange-600">{lowStockProducts.length}</div>
            <p className="text-[11px] text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-semibold leading-tight text-red-600">{outOfStockProducts.length}</div>
            <p className="text-[11px] text-muted-foreground">Unavailable items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-semibold leading-tight">{formatCurrencyWithCode(totalInventoryValue, getCurrency())}</div>
            <p className="text-[11px] text-muted-foreground">Total cost value</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <select
            className="px-3 py-2 border rounded-md bg-background h-9"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateCategoryOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Category
          </Button>
          <Button onClick={() => setIsCreateProductOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Product
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Stock Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground">{product.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>{product.category?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{product.quantity_in_stock} {product.unit_of_measure}</div>
                          <div className="text-muted-foreground">Min: {product.minimum_stock_level}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrencyWithCode(product.unit_price, getCurrency())}</TableCell>
                      <TableCell>{getStockBadge(product)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product.id);
                              setIsStockAdjustmentOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Adjust Stock
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProductMutation.mutate(product.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories?.map((category) => (
                  <Card key={category.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-muted-foreground">{category.description}</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.product?.name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.transaction_type === 'in' ? 'default' :
                          transaction.transaction_type === 'out' ? 'destructive' :
                          'secondary'
                        }>
                          {transaction.transaction_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.transaction_type === 'out' ? '-' : '+'}{transaction.quantity}
                      </TableCell>
                      <TableCell>{transaction.reference_type || '-'}</TableCell>
                      <TableCell>{transaction.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateProductModal 
        open={isCreateProductOpen} 
        onOpenChange={setIsCreateProductOpen} 
      />
      <CreateCategoryModal 
        open={isCreateCategoryOpen} 
        onOpenChange={setIsCreateCategoryOpen} 
      />
      <StockAdjustmentModal
        open={isStockAdjustmentOpen}
        onOpenChange={setIsStockAdjustmentOpen}
        productId={selectedProduct}
      />
    </div>
  );
};

export default InventoryDashboard;