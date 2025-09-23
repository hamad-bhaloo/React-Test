
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useCompanySetup = () => {
  const { user } = useAuth();
  const [hasCompany, setHasCompany] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkCompanySetup = async () => {
    if (!user) {
      console.log('useCompanySetup - No user, setting loading to false');
      setHasCompany(false);
      setLoading(false);
      return;
    }

    console.log('useCompanySetup - Checking company setup for user:', user.id);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('useCompanySetup - Error checking company setup:', error);
        setHasCompany(false);
      } else {
        // Company exists if data is not null and has an id
        const companyExists = data && data.id;
        console.log('useCompanySetup - Company exists:', !!companyExists, 'Data:', data);
        setHasCompany(!!companyExists);
      }
    } catch (error) {
      console.error('useCompanySetup - Exception checking company setup:', error);
      setHasCompany(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCompanySetup();
  }, [user?.id]);

  // Refetch function to manually trigger a check
  const refetch = async () => {
    await checkCompanySetup();
  };

  // Add a function to mark company as created (for immediate UI update)
  const markCompanyAsCreated = () => {
    setHasCompany(true);
  };

  console.log('useCompanySetup - Current state:', { hasCompany, loading, userId: user?.id });
  
  return { hasCompany, loading, refetch, markCompanyAsCreated };
};
