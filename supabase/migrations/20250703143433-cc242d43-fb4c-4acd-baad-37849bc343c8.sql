-- Update team invitations RLS policy to allow company owners to create invitations
DROP POLICY IF EXISTS "Company admins can manage invitations" ON public.team_invitations;

CREATE POLICY "Company admins can manage invitations" 
ON public.team_invitations 
FOR ALL 
USING (
  is_company_owner(company_id, auth.uid()) OR 
  is_team_admin(company_id, auth.uid()) OR
  auth.uid() = invited_by
);

-- Also allow inserting invitations with proper check
CREATE POLICY "Company owners can create invitations" 
ON public.team_invitations 
FOR INSERT 
WITH CHECK (
  is_company_owner(company_id, auth.uid()) OR 
  is_team_admin(company_id, auth.uid())
);