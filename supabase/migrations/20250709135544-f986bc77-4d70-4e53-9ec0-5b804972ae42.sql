-- Create an admin user by inserting admin role
-- First, let's see if we have any existing users and create an admin role
-- You can replace the email with your actual user email after signup

-- Insert admin role for a user (replace with actual user ID after they sign up)
-- This is a template - you'll need to run this after creating a user account

-- Example: If you want to make a user with email 'admin@example.com' an admin:
-- First sign up normally, then run this query with their actual user_id

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'admin@example.com'  -- Replace with your email
ON CONFLICT (user_id, role) DO NOTHING;

-- Alternative: If you know the specific user_id, you can use:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('your-user-id-here', 'admin'::app_role)
-- ON CONFLICT (user_id, role) DO NOTHING;