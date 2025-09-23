-- First drop the incorrect trigger
DROP TRIGGER IF EXISTS update_quotation_totals_trigger ON public.quotation_items;

-- Create a modified version of the update_invoice_totals function for quotations
CREATE OR REPLACE FUNCTION public.update_quotation_totals()
RETURNS TRIGGER AS $function$
BEGIN
  UPDATE public.quotations 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.quotation_items 
      WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);
  
  -- Update total_amount with tax and discount calculations
  UPDATE public.quotations 
  SET 
    tax_amount = (subtotal * tax_percentage / 100),
    total_amount = subtotal - discount_amount + (subtotal * tax_percentage / 100) + shipping_charge,
    updated_at = now()
  WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$ LANGUAGE plpgsql;

-- Create the correct trigger for quotations
CREATE TRIGGER update_quotation_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.quotation_items
FOR EACH ROW
EXECUTE FUNCTION public.update_quotation_totals();