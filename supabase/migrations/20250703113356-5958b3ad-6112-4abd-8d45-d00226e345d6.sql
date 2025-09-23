-- Add existing company owners as admin team members for companies that already exist
INSERT INTO public.team_members (
  company_id,
  user_id,
  email,
  role,
  status,
  joined_at
)
SELECT 
  c.id,
  c.user_id,
  COALESCE(p.email, 'unknown@example.com'),
  'admin',
  'active',
  c.created_at
FROM public.companies c
LEFT JOIN public.profiles p ON p.id = c.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_members tm 
  WHERE tm.company_id = c.id AND tm.user_id = c.user_id
);