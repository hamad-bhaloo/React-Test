
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useClients = () => {
  const { user, loading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for fetching clients');
        return [];
      }
      
      console.log('Fetching clients for user:', user.id);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
      
      console.log('Successfully fetched clients:', data?.length);
      return data || [];
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false, // Only fetch when mounted for the first time
  });
};
