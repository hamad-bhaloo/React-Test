-- First, let's manually close any debt collections for fully paid invoices
UPDATE public.debt_collections 
SET 
  status = 'closed',
  settlement_amount = (
    SELECT total_amount 
    FROM public.invoices 
    WHERE invoices.id = debt_collections.invoice_id
  ),
  settlement_date = CURRENT_DATE,
  updated_at = now()
WHERE invoice_id IN (
  SELECT id 
  FROM public.invoices 
  WHERE payment_status = 'paid'
) 
AND status NOT IN ('closed', 'cancelled');

-- Now let's improve the trigger to handle all payment scenarios
CREATE OR REPLACE FUNCTION public.auto_close_debt_collections()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the invoice is now fully paid (payment_status = 'paid' OR paid_amount >= total_amount)
  IF (NEW.payment_status = 'paid' OR NEW.paid_amount >= NEW.total_amount) 
     AND (OLD.payment_status IS DISTINCT FROM 'paid' OR OLD.paid_amount < OLD.total_amount) THEN
    
    -- Update any debt collections for this invoice to 'closed' status
    UPDATE public.debt_collections 
    SET 
      status = 'closed',
      settlement_amount = NEW.total_amount,
      settlement_date = CURRENT_DATE,
      updated_at = now()
    WHERE invoice_id = NEW.id 
      AND status NOT IN ('closed', 'cancelled');
      
    -- Log the closure in activity if there are debt collections
    INSERT INTO public.debt_collection_activities (
      debt_collection_id,
      user_id,
      activity_type,
      description,
      created_at
    )
    SELECT 
      dc.id,
      dc.user_id,
      'payment',
      'Case automatically closed - invoice fully paid',
      now()
    FROM public.debt_collections dc
    WHERE dc.invoice_id = NEW.id 
      AND dc.status = 'closed'
      AND dc.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;