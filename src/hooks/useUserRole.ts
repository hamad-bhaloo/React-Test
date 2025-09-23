import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      console.log('useUserRole - Getting role for user:', user?.id);
      if (!user) {
        console.log('useUserRole - No user, setting role to null');
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Use the database function to get the highest priority role
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role', { _user_id: user.id });

        if (roleError) {
          console.error('useUserRole - Error fetching user role:', roleError);
          setRole('user'); // Default to user role
          return;
        }

        if (roleData) {
          // User has a role entry
          console.log('useUserRole - Found existing role:', roleData);
          setRole(roleData);
        } else {
          // User doesn't have a role entry - create one with default 'user' role
          console.log('No role found for user, creating default user role');
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'user'
            });

          if (insertError) {
            console.error('useUserRole - Error creating default user role:', insertError);
          } else {
            console.log('useUserRole - Successfully created default user role');
          }
          
          setRole('user'); // Set as user regardless of insert success
        }
      } catch (error) {
        console.error('Error in getUserRole:', error);
        setRole('user'); // Default to user role
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  return {
    role,
    isAdmin,
    isUser,
    loading
  };
};