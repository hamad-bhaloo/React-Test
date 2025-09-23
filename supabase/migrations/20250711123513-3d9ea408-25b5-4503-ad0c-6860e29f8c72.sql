-- Create a function to automatically close debt collections when invoices are paid
CREATE OR REPLACE FUNCTION public.auto_close_debt_collections()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the invoice is now fully paid
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid') THEN
    -- Update any debt collections for this invoice to 'closed' status
    UPDATE public.debt_collections 
    SET 
      status = 'closed',
      settlement_amount = NEW.total_amount,
      settlement_date = CURRENT_DATE,
      updated_at = now()
    WHERE invoice_id = NEW.id 
      AND status NOT IN ('closed', 'cancelled');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically close debt collections when invoices are paid
DROP TRIGGER IF EXISTS trigger_auto_close_debt_collections ON public.invoices;
CREATE TRIGGER trigger_auto_close_debt_collections
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_close_debt_collections();