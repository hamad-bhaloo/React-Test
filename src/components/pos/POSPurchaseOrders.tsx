import React, { useState } from 'react';
import { Plus, Package, Calendar, DollarSign, Search, Filter, Eye, Edit, Trash2, FileText, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrencyWithCode } from '@/utils/currencyConverter';
import { usePurchaseOrders, useCreatePurchaseOrder, useGeneratePurchaseOrderNumber, useUpdatePurchaseOrderStatus, usePurchaseOrderItems } from '@/hooks/usePurchaseOrders';
import { useInventoryProducts } from '@/hooks/useInventory';
import { useClients } from '@/hooks/useClients';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useInvoiceNumber } from '@/hooks/useInvoiceNumber';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface POSPurchaseOrdersProps {
  currency?: string;
}

interface PurchaseOrderItem {
  product_id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
}

const POSPurchaseOrders: React.FC<POSPurchaseOrdersProps> = ({ currency = 'USD' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Form state for creating purchase orders
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemCost, setItemCost] = useState(0);

  const { data: purchaseOrders, isLoading } = usePurchaseOrders();
  const { data: products } = useInventoryProducts();
  const { data: orderNumber } = useGeneratePurchaseOrderNumber();
  const { data: clients } = useClients();
  const createPurchaseOrder = useCreatePurchaseOrder();
  const createInvoice = useCreateInvoice();
  const updateOrderStatus = useUpdatePurchaseOrderStatus();
  const { data: invoiceNumber } = useInvoiceNumber('INV', 'sequential');

  const filteredOrders = purchaseOrders?.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const addItemToOrder = () => {
    const product = products?.find(p => p.id === selectedProduct);
    if (!product) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    if (itemQuantity <= 0 || itemCost <= 0) {
      toast({
        title: "Error",
        description: "Please enter valid quantity and cost",
        variant: "destructive",
      });
      return;
    }

    const existingItemIndex = orderItems.findIndex(item => item.product_id === selectedProduct);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + itemQuantity,
        line_total: (updatedItems[existingItemIndex].quantity + itemQuantity) * itemCost
      };
      setOrderItems(updatedItems);
    } else {
      const newItem: PurchaseOrderItem = {
        product_id: selectedProduct,
        product_name: product.name,
        sku: product.sku,
        quantity: itemQuantity,
        unit_cost: itemCost,
        line_total: itemQuantity * itemCost,
      };
      setOrderItems([...orderItems, newItem]);
    }

    // Reset form
    setSelectedProduct('');
    setItemQuantity(1);
    setItemCost(0);
  };

  const removeItemFromOrder = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId));
  };

  const calculateOrderTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.line_total, 0);
    const taxAmount = subtotal * 0.1; // 10% tax for example
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  };

  const convertToInvoice = async (order: any) => {
    try {
      if (!invoiceNumber) {
        toast({
          title: "Error",
          description: "Failed to generate invoice number",
          variant: "destructive",
        });
        return;
      }

      // Check if vendor exists as a client, if not create one
      let vendorClient = clients?.find(client => 
        client.name?.toLowerCase() === order.supplier_name?.toLowerCase() ||
        client.email === order.supplier_email
      );

      if (!vendorClient) {
        // Get current user for user_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Create vendor as a client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            name: order.supplier_name,
            email: order.supplier_email || undefined,
            client_type: 'business',
            company: order.supplier_name,
            status: 'active',
          })
          .select()
          .single();

        if (clientError) throw clientError;
        vendorClient = newClient;
      }

      // Get purchase order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      if (!orderItems || orderItems.length === 0) {
        toast({
          title: "Error",
          description: "No items found in purchase order",
          variant: "destructive",
        });
        return;
      }

      // Create invoice from purchase order
      const invoiceData = {
        invoice_number: invoiceNumber,
        client_id: vendorClient.id,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        currency: order.currency,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        total_amount: order.total_amount,
        status: 'draft',
        payment_status: 'unpaid',
        notes: `Vendor invoice from Purchase Order: ${order.order_number}`,
        terms: 'Net 30',
      };

      // Convert purchase order items to invoice items
      const invoiceItems = orderItems.map(item => ({
        product_name: item.product_name,
        description: item.sku ? `SKU: ${item.sku}` : '',
        quantity: item.quantity,
        rate: item.unit_cost,
        amount: item.line_total,
        unit: 'pcs',
      }));

      await createInvoice.mutateAsync({
        invoice: invoiceData,
        items: invoiceItems,
      });

      // Update purchase order status to received
      await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: 'received',
      });

      toast({
        title: "Success",
        description: `Vendor invoice ${invoiceNumber} created from purchase order ${order.order_number}`,
      });

    } catch (error) {
      console.error('Error converting to invoice:', error);
      toast({
        title: "Error",
        description: "Failed to convert purchase order to invoice",
        variant: "destructive",
      });
    }
  };

  const handleCreateOrder = async () => {
    if (!supplierName.trim()) {
      toast({
        title: "Error",
        description: "Please enter supplier name",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the order",
        variant: "destructive",
      });
      return;
    }

    if (!orderNumber) {
      toast({
        title: "Error",
        description: "Failed to generate order number",
        variant: "destructive",
      });
      return;
    }

    try {
      const totals = calculateOrderTotal();
      
      await createPurchaseOrder.mutateAsync({
        order: {
          order_number: orderNumber,
          supplier_name: supplierName,
          supplier_email: supplierEmail || undefined,
          expected_delivery_date: expectedDeliveryDate || undefined,
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          total_amount: totals.total,
          currency: currency,
          status: 'draft',
          notes: notes || undefined,
          order_date: new Date().toISOString().split('T')[0],
        },
        items: orderItems,
      });

      // Reset form
      setSupplierName('');
      setSupplierEmail('');
      setExpectedDeliveryDate('');
      setNotes('');
      setOrderItems([]);
      setIsCreateModalOpen(false);
      
      toast({
        title: "Success",
        description: `Purchase order ${orderNumber} created successfully`,
      });
    } catch (error) {
      console.error('Create order error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totals = calculateOrderTotal();

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="text-muted-foreground">Manage your inventory purchase orders</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Supplier Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier-name">Supplier Name *</Label>
                  <Input
                    id="supplier-name"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Enter supplier name"
                  />
                </div>
                <div>
                  <Label htmlFor="supplier-email">Supplier Email</Label>
                  <Input
                    id="supplier-email"
                    type="email"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    placeholder="supplier@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="delivery-date">Expected Delivery Date</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>

              {/* Add Items Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>Product</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} {product.sku && `(${product.sku})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Unit Cost</Label>
                    <Input
                      type="number"
                      value={itemCost}
                      onChange={(e) => setItemCost(Number(e.target.value))}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addItemToOrder} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </div>

                {/* Order Items List */}
                {orderItems.length > 0 && (
                  <div className="space-y-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Line Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.product_id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>{item.sku || '-'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrencyWithCode(item.unit_cost, currency)}</TableCell>
                            <TableCell>{formatCurrencyWithCode(item.line_total, currency)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeItemFromOrder(item.product_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Order Totals */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrencyWithCode(totals.subtotal, currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatCurrencyWithCode(totals.taxAmount, currency)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrencyWithCode(totals.total, currency)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes for this purchase order..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateOrder} 
                  disabled={createPurchaseOrder.isPending || orderItems.length === 0}
                  className="flex-1"
                >
                  {createPurchaseOrder.isPending ? 'Creating...' : 'Create Purchase Order'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by order number or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Purchase Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading purchase orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders found. Create your first purchase order to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{order.order_number}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Supplier: {order.supplier_name}</p>
                          <p>Order Date: {new Date(order.order_date).toLocaleDateString()}</p>
                          {order.expected_delivery_date && (
                            <p>Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {formatCurrencyWithCode(order.total_amount, order.currency)}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsViewModalOpen(true);
                            }}
                            title="View Order"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'draft' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsEditModalOpen(true);
                              }}
                              title="Edit Order"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {order.status === 'draft' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => updateOrderStatus.mutateAsync({
                                orderId: order.id,
                                status: 'sent'
                              })}
                              disabled={updateOrderStatus.isPending}
                              title="Send Order"
                            >
                              Send
                            </Button>
                          )}
                          {order.status === 'sent' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => updateOrderStatus.mutateAsync({
                                orderId: order.id,
                                status: 'confirmed'
                              })}
                              disabled={updateOrderStatus.isPending}
                              title="Confirm Order"
                            >
                              Confirm
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => convertToInvoice(order)}
                              disabled={createInvoice.isPending}
                              title="Convert to Vendor Invoice"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Order Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Purchase Order - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && <ViewOrderContent order={selectedOrder} currency={currency} />}
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && <EditOrderContent order={selectedOrder} onSave={() => setIsEditModalOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// View Order Content Component
const ViewOrderContent = ({ order, currency }: { order: any; currency: string }) => {
  const { data: orderItems } = usePurchaseOrderItems(order.id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Supplier</Label>
          <p className="font-medium">{order.supplier_name}</p>
        </div>
        <div>
          <Label>Email</Label>
          <p>{order.supplier_email || 'N/A'}</p>
        </div>
        <div>
          <Label>Order Date</Label>
          <p>{new Date(order.order_date).toLocaleDateString()}</p>
        </div>
        <div>
          <Label>Expected Delivery</Label>
          <p>{order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>

      <div>
        <Label>Status</Label>
        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
      </div>

      {orderItems && orderItems.length > 0 && (
        <div>
          <Label>Order Items</Label>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.sku || '-'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrencyWithCode(item.unit_cost, currency)}</TableCell>
                  <TableCell>{formatCurrencyWithCode(item.line_total, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="border-t pt-4 space-y-2 mt-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrencyWithCode(order.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{formatCurrencyWithCode(order.tax_amount, currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrencyWithCode(order.total_amount, currency)}</span>
            </div>
          </div>
        </div>
      )}

      {order.notes && (
        <div>
          <Label>Notes</Label>
          <p className="mt-1 p-2 bg-muted rounded">{order.notes}</p>
        </div>
      )}
    </div>
  );
};

// Edit Order Content Component  
const EditOrderContent = ({ order, onSave }: { order: any; onSave: () => void }) => {
  return (
    <div className="text-center py-8 text-muted-foreground">
      Edit functionality will be implemented in the next update.
      <br />
      Currently, only draft orders can be edited.
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'sent': return 'bg-blue-100 text-blue-800';
    case 'confirmed': return 'bg-yellow-100 text-yellow-800';
    case 'received': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default POSPurchaseOrders;