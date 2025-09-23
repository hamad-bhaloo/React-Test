import React, { useState } from 'react';
import { Calendar, Receipt, Eye, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { usePOSSales } from '@/hooks/usePOS';
import { formatCurrencyWithCode } from '@/utils/currencyConverter';

const POSSalesHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  
  const { data: sales, isLoading } = usePOSSales();

  const filteredSales = sales?.filter(sale =>
    sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.customer?.name && sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by sale number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.sale_number}</TableCell>
                  <TableCell>
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{sale.customer?.name || 'Walk-in Customer'}</TableCell>
                  <TableCell>{sale.items?.length || 0} items</TableCell>
                  <TableCell>{formatCurrencyWithCode(sale.total_amount, sale.currency)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.payment_method}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sale.payment_status === 'paid' ? 'default' : 'destructive'}>
                      {sale.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSale(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Sale Details - {sale.sale_number}</DialogTitle>
                        </DialogHeader>
                        {selectedSale && (
                          <div className="space-y-4">
                            {/* Sale Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Sale Number</label>
                                <p className="text-sm text-muted-foreground">{selectedSale.sale_number}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Date</label>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(selectedSale.sale_date).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Customer</label>
                                <p className="text-sm text-muted-foreground">
                                  {selectedSale.customer?.name || 'Walk-in Customer'}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Payment Method</label>
                                <p className="text-sm text-muted-foreground">{selectedSale.payment_method}</p>
                              </div>
                            </div>

                            {/* Items */}
                            <div>
                              <label className="text-sm font-medium">Items</label>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedSale.items?.map((item: any) => (
                                    <TableRow key={item.id}>
                                      <TableCell>{item.product_name}</TableCell>
                                      <TableCell>{item.sku || '-'}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>{formatCurrencyWithCode(item.unit_price, selectedSale.currency)}</TableCell>
                                      <TableCell>{formatCurrencyWithCode(item.line_total, selectedSale.currency)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Totals */}
                            <div className="border-t pt-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>{formatCurrencyWithCode(selectedSale.subtotal, selectedSale.currency)}</span>
                                </div>
                                {selectedSale.discount_amount > 0 && (
                                  <div className="flex justify-between">
                                    <span>Discount:</span>
                                    <span>-{formatCurrencyWithCode(selectedSale.discount_amount, selectedSale.currency)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Tax:</span>
                                  <span>{formatCurrencyWithCode(selectedSale.tax_amount, selectedSale.currency)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                  <span>Total:</span>
                                  <span>{formatCurrencyWithCode(selectedSale.total_amount, selectedSale.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Amount Paid:</span>
                                  <span>{formatCurrencyWithCode(selectedSale.amount_paid, selectedSale.currency)}</span>
                                </div>
                                {selectedSale.change_amount > 0 && (
                                  <div className="flex justify-between">
                                    <span>Change:</span>
                                    <span>{formatCurrencyWithCode(selectedSale.change_amount, selectedSale.currency)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {selectedSale.notes && (
                              <div>
                                <label className="text-sm font-medium">Notes</label>
                                <p className="text-sm text-muted-foreground">{selectedSale.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSales.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No sales found. Start making sales in the POS terminal.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default POSSalesHistory;