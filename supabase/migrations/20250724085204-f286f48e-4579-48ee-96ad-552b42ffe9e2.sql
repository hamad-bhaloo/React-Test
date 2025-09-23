-- Create admin user and set up admin role
-- This will create the user with the specified credentials and assign admin role

-- Insert the admin user directly into auth.users (bypassing email verification)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_sent_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@accellionx.com',
    crypt('Password@123', gen_salt('bf')), -- Encrypted password
    now(), -- Email confirmed immediately
    now(),
    now(),
    '',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin User"}',
    false,
    'authenticated',
    'authenticated',
    now()
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID for the admin user we just created
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@accellionx.com';
    
    -- If user exists, ensure they have admin role
    IF admin_user_id IS NOT NULL THEN
        -- Insert admin role (will do nothing if already exists due to unique constraint)
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (admin_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Create profile for admin user
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (admin_user_id, 'admin@accellionx.com', 'Admin User')
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name;
            
        RAISE NOTICE 'Admin user created successfully with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Failed to create admin user';
    END IF;
END $$;