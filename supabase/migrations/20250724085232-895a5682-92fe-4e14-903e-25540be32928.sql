-- Create admin user role and profile
-- We'll create the profile and role first, then the user can be created via auth

-- First, let's create a function to handle admin user creation
CREATE OR REPLACE FUNCTION public.create_admin_user(
    admin_email TEXT,
    admin_name TEXT DEFAULT 'Admin User'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Generate a UUID for the admin user
    admin_user_id := gen_random_uuid();
    
    -- Insert profile for admin user
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (admin_user_id, admin_email, admin_name)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN admin_user_id;
END;
$$;

-- Create the admin user profile and role
SELECT public.create_admin_user('admin@accellionx.com', 'Admin User') as admin_user_id;