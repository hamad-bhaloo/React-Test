import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Wallet, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInventoryProducts } from '@/hooks/useInventory';
import { useClients } from '@/hooks/useClients';
import { useCreatePOSSale, useGenerateSaleNumber, type CartItem } from '@/hooks/usePOS';
import { formatCurrencyWithCode } from '@/utils/currencyConverter';
import { toast } from '@/hooks/use-toast';

interface POSTerminalProps { currency?: string }

const POSTerminal: React.FC<POSTerminalProps> = ({ currency = 'USD' }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const { data: products, isLoading: productsLoading } = useInventoryProducts();
  const { data: clients } = useClients();
  const { data: saleNumber } = useGenerateSaleNumber();
  const createSale = useCreatePOSSale();

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const addToCart = (product: any) => {
    // Prevent adding when inventory is tracked, backorders are not allowed, and no stock
    if (product.track_inventory && !product.allow_backorder && product.quantity_in_stock <= 0) {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently unavailable`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: 1,
        unit_price: product.unit_price,
        discount_amount: 0,
        tax_rate: product.tax_rate || 0,
        line_total: product.unit_price,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products?.find((p) => p.id === productId);
    if (product && product.track_inventory && !product.allow_backorder && newQuantity > product.quantity_in_stock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${product.quantity_in_stock} available for ${product.name}`,
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map(item => 
      item.product_id === productId 
        ? { 
            ...item, 
            quantity: newQuantity, 
            line_total: (item.unit_price * newQuantity) - item.discount_amount 
          }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxAmount = cart.reduce((sum, item) => {
      const itemAfterDiscount = item.line_total - ((item.line_total * discount) / 100);
      return sum + (itemAfterDiscount * item.tax_rate / 100);
    }, 0);
    const total = subtotal - discountAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  };

  const totals = calculateTotals();
  const changeAmount = amountPaid - totals.total;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    if (amountPaid < totals.total) {
      toast({
        title: "Error",
        description: "Amount paid is less than total",
        variant: "destructive",
      });
      return;
    }

    // Final stock validation before checkout
    for (const item of cart) {
      const product = products?.find((p) => p.id === item.product_id);
      if (product && product.track_inventory && !product.allow_backorder && item.quantity > product.quantity_in_stock) {
        toast({
          title: "Insufficient stock",
          description: `Cannot sell ${item.quantity} × ${item.product_name}. Only ${product.quantity_in_stock} in stock`,
          variant: "destructive",
        });
        return;
      }
    }

    if (!saleNumber) {
      toast({
        title: "Error",
        description: "Failed to generate sale number",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSale.mutateAsync({
        sale: {
          sale_number: saleNumber,
          customer_id: selectedCustomer || undefined,
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          discount_amount: totals.discountAmount,
          total_amount: totals.total,
          amount_paid: amountPaid,
          change_amount: changeAmount,
          payment_method: paymentMethod,
          payment_status: 'paid',
          currency: currency,
          notes: notes || undefined,
          sale_date: new Date().toISOString(),
        },
        items: cart,
      });

      // Reset form
      setCart([]);
      setSelectedCustomer('');
      setAmountPaid(0);
      setNotes('');
      setDiscount(0);
      setIsCheckoutOpen(false);
      
      toast({
        title: "Success",
        description: `Sale ${saleNumber} completed successfully`,
      });
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  useEffect(() => {
    setAmountPaid(totals.total);
  }, [totals.total]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Product Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            
            {productsLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium text-sm">{product.name}</div>
                      {product.sku && (
                        <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-primary">
                          {formatCurrencyWithCode(product.unit_price, currency)}
                        </span>
                        <Badge variant={product.quantity_in_stock > 0 ? "default" : "destructive"}>
                          {product.quantity_in_stock} in stock
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart & Checkout */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Cart ({cart.length} items)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.product_name}</div>
                    {item.sku && (
                      <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                    )}
                    <div className="text-sm">
                      {formatCurrencyWithCode(item.unit_price, currency)} × {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      disabled={(() => {
                        const p = products?.find((pr) => pr.id === item.product_id);
                        return !!(p && p.track_inventory && !p.allow_backorder && item.quantity >= p.quantity_in_stock);
                      })()}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromCart(item.product_id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Cart is empty. Add products to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {cart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrencyWithCode(totals.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount ({discount}%):</span>
                <span>-{formatCurrencyWithCode(totals.discountAmount, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrencyWithCode(totals.taxAmount, currency)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrencyWithCode(totals.total, currency)}</span>
                </div>
              </div>
              
              <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mt-4" size="lg">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Checkout
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Complete Sale</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customer">Customer (Optional)</Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="discount">Discount (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="wallet">Wallet</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amount-paid">Amount Paid</Label>
                      <Input
                        id="amount-paid"
                        type="number"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Number(e.target.value))}
                        step="0.01"
                      />
                    </div>

                    {changeAmount > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <div className="font-medium text-green-800">
                          Change: {formatCurrencyWithCode(changeAmount, currency)}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes for this sale..."
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between font-bold text-lg mb-4">
                        <span>Total:</span>
                        <span>{formatCurrencyWithCode(totals.total, currency)}</span>
                      </div>
                      <Button 
                        onClick={handleCheckout} 
                        className="w-full" 
                        size="lg"
                        disabled={createSale.isPending || amountPaid < totals.total}
                      >
                        {createSale.isPending ? 'Processing...' : 'Complete Sale'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default POSTerminal;