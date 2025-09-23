-- Create inventory categories table
CREATE TABLE public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory products table
CREATE TABLE public.inventory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.inventory_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER DEFAULT 5,
  maximum_stock_level INTEGER,
  unit_of_measure TEXT DEFAULT 'pcs',
  tax_rate NUMERIC DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory transactions table (stock movements)
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.inventory_products(id),
  transaction_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  reference_type TEXT, -- 'purchase', 'sale', 'adjustment', 'return'
  reference_id UUID, -- invoice_id, purchase_order_id, etc.
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create POS sales table
CREATE TABLE public.pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sale_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.clients(id),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  change_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'paid',
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  invoice_id UUID REFERENCES public.invoices(id),
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create POS sale items table
CREATE TABLE public.pos_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.inventory_products(id),
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase orders table
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  supplier_name TEXT,
  supplier_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'confirmed', 'received', 'cancelled'
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase order items table
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.inventory_products(id),
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_categories
CREATE POLICY "Users can manage their own inventory categories" ON public.inventory_categories
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for inventory_products
CREATE POLICY "Users can manage their own inventory products" ON public.inventory_products
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for inventory_transactions
CREATE POLICY "Users can manage their own inventory transactions" ON public.inventory_transactions
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for pos_sales
CREATE POLICY "Users can manage their own POS sales" ON public.pos_sales
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for pos_sale_items
CREATE POLICY "Users can manage their own POS sale items" ON public.pos_sale_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.pos_sales 
  WHERE pos_sales.id = pos_sale_items.sale_id 
  AND pos_sales.user_id = auth.uid()
));

-- Create RLS policies for purchase_orders
CREATE POLICY "Users can manage their own purchase orders" ON public.purchase_orders
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for purchase_order_items
CREATE POLICY "Users can manage their own purchase order items" ON public.purchase_order_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.purchase_orders 
  WHERE purchase_orders.id = purchase_order_items.order_id 
  AND purchase_orders.user_id = auth.uid()
));

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION public.update_inventory_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'in' THEN
    UPDATE public.inventory_products 
    SET quantity_in_stock = quantity_in_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'out' THEN
    UPDATE public.inventory_products 
    SET quantity_in_stock = quantity_in_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'adjustment' THEN
    UPDATE public.inventory_products 
    SET quantity_in_stock = NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update POS sale totals
CREATE OR REPLACE FUNCTION public.update_pos_sale_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.pos_sales 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0) 
      FROM public.pos_sale_items 
      WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  
  -- Update total_amount with tax and discount
  UPDATE public.pos_sales 
  SET 
    total_amount = subtotal - discount_amount + tax_amount,
    updated_at = now()
  WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create function to update purchase order totals
CREATE OR REPLACE FUNCTION public.update_purchase_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.purchase_orders 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0) 
      FROM public.purchase_order_items 
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  -- Update total_amount with tax
  UPDATE public.purchase_orders 
  SET 
    total_amount = subtotal + tax_amount,
    updated_at = now()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_inventory_stock_trigger
AFTER INSERT ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_inventory_product_stock();

CREATE TRIGGER update_pos_sale_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.pos_sale_items
FOR EACH ROW EXECUTE FUNCTION public.update_pos_sale_totals();

CREATE TRIGGER update_purchase_order_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_items
FOR EACH ROW EXECUTE FUNCTION public.update_purchase_order_totals();

-- Create unique constraints
CREATE UNIQUE INDEX idx_inventory_products_sku_user ON public.inventory_products(user_id, sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX idx_pos_sales_number_user ON public.pos_sales(user_id, sale_number);
CREATE UNIQUE INDEX idx_purchase_orders_number_user ON public.purchase_orders(user_id, order_number);

-- Create indexes for better performance
CREATE INDEX idx_inventory_products_category ON public.inventory_products(category_id);
CREATE INDEX idx_inventory_products_stock ON public.inventory_products(quantity_in_stock);
CREATE INDEX idx_inventory_transactions_product ON public.inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_date ON public.inventory_transactions(transaction_date);
CREATE INDEX idx_pos_sales_date ON public.pos_sales(sale_date);
CREATE INDEX idx_pos_sales_customer ON public.pos_sales(customer_id);