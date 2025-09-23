-- Add default 'user' role for all existing users who don't have a role entry
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'user'::app_role
FROM public.profiles p
WHERE p.id NOT IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE user_id IS NOT NULL
);