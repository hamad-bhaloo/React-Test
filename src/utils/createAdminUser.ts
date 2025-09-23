import { supabase } from "@/integrations/supabase/client";

export const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    const { data, error } = await supabase.functions.invoke('create-admin-user', {
      body: {
        email: 'admin@accellionx.com',
        password: 'Password@123',
        fullName: 'Admin User'
      }
    });

    if (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }

    console.log('Admin user created successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to create admin user:', error);
    throw error;
  }
};