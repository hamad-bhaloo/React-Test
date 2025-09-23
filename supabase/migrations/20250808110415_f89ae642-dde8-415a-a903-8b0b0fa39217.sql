-- Fix security issues by adding proper search_path to functions
CREATE OR REPLACE FUNCTION public.update_inventory_product_stock()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_pos_sale_totals()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_purchase_order_totals()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;