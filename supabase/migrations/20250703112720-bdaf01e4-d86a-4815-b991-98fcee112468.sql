-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create team_members table for managing company team members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, user_id),
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team members
CREATE POLICY "Company admins can view all team members" 
ON public.team_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = team_members.company_id 
    AND companies.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.company_id = team_members.company_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'admin' 
    AND tm.status = 'active'
  )
);

CREATE POLICY "Company admins can manage team members" 
ON public.team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = team_members.company_id 
    AND companies.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.company_id = team_members.company_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'admin' 
    AND tm.status = 'active'
  )
);

-- Create team_invitations table for pending invitations
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Enable RLS for invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Company admins can manage invitations" 
ON public.team_invitations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = team_invitations.company_id 
    AND companies.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.company_id = team_invitations.company_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'admin' 
    AND tm.status = 'active'
  )
);

-- Allow public access to view invitations by token (for accepting invitations)
CREATE POLICY "Public can view invitations by token" 
ON public.team_invitations 
FOR SELECT 
USING (invitation_token IS NOT NULL);

-- Create function to automatically add company owner as admin team member
CREATE OR REPLACE FUNCTION public.add_company_owner_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (
    company_id,
    user_id,
    email,
    role,
    status,
    joined_at
  ) VALUES (
    NEW.id,
    NEW.user_id,
    (SELECT email FROM auth.users WHERE id = NEW.user_id),
    'admin',
    'active',
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add company owner as admin
CREATE TRIGGER add_company_owner_as_admin_trigger
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.add_company_owner_as_admin();

-- Update timestamp trigger for team_members
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();