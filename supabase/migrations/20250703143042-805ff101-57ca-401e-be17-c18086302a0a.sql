-- Add trigger to auto-generate invitation token and expiry date
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a random token if not provided
  IF NEW.invitation_token IS NULL OR NEW.invitation_token = '' THEN
    NEW.invitation_token = gen_random_uuid()::text;
  END IF;
  
  -- Set expiry date to 7 days from now if not provided
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at = NOW() + INTERVAL '7 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for team_invitations
DROP TRIGGER IF EXISTS trigger_generate_invitation_token ON public.team_invitations;
CREATE TRIGGER trigger_generate_invitation_token
  BEFORE INSERT ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invitation_token();