-- Create security definer functions to avoid RLS recursion issues

-- Function to check if user is company owner
CREATE OR REPLACE FUNCTION public.is_company_owner(_company_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = _company_id AND user_id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is team admin
CREATE OR REPLACE FUNCTION public.is_team_admin(_company_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE company_id = _company_id 
    AND user_id = _user_id 
    AND role = 'admin' 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Company admins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Company admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Company admins can manage invitations" ON public.team_invitations;

-- Create new policies using security definer functions
CREATE POLICY "Company admins can view all team members" 
ON public.team_members 
FOR SELECT 
USING (
  public.is_company_owner(team_members.company_id, auth.uid()) 
  OR 
  public.is_team_admin(team_members.company_id, auth.uid())
);

CREATE POLICY "Company admins can manage team members" 
ON public.team_members 
FOR ALL 
USING (
  public.is_company_owner(team_members.company_id, auth.uid()) 
  OR 
  public.is_team_admin(team_members.company_id, auth.uid())
);

CREATE POLICY "Company admins can manage invitations" 
ON public.team_invitations 
FOR ALL 
USING (
  public.is_company_owner(team_invitations.company_id, auth.uid()) 
  OR 
  public.is_team_admin(team_invitations.company_id, auth.uid())
);