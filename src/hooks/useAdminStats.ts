import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  recentUsers: Array<{
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    role: string;
  }>;
  subscriptionsByTier: Array<{
    tier: string;
    count: number;
  }>;
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get total users
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get active users (users who logged in last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { count: activeUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', thirtyDaysAgo);

        // Get total subscriptions
        const { count: totalSubscriptions } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true });

        // Get active subscriptions
        const { count: activeSubscriptions } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('subscribed', true)
          .or('subscription_end.is.null,subscription_end.gte.' + new Date().toISOString());

        // Get recent users with roles
        const { data: recentUsers } = await supabase
          .from('profiles')
          .select('id, email, full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        // Get user roles for recent users
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, role');

        const recentUsersWithRoles = recentUsers?.map(user => ({
          ...user,
          role: userRoles?.find(role => role.user_id === user.id)?.role || 'user'
        })) || [];

        // Get subscriptions by tier
        const { data: subscriptions } = await supabase
          .from('subscribers')
          .select('subscription_tier')
          .eq('subscribed', true);

        const subscriptionsByTier = subscriptions?.reduce((acc: any[], sub) => {
          const tier = sub.subscription_tier || 'Free';
          const existing = acc.find(item => item.tier === tier);
          if (existing) {
            existing.count += 1;
          } else {
            acc.push({ tier, count: 1 });
          }
          return acc;
        }, []) || [];

        // Get users by role
        const usersByRole = userRoles?.reduce((acc: any[], role) => {
          const existing = acc.find(item => item.role === role.role);
          if (existing) {
            existing.count += 1;
          } else {
            acc.push({ role: role.role, count: 1 });
          }
          return acc;
        }, []) || [];

        setStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalSubscriptions: totalSubscriptions || 0,
          activeSubscriptions: activeSubscriptions || 0,
          recentUsers: recentUsersWithRoles,
          subscriptionsByTier,
          usersByRole
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to fetch admin statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  return { stats, loading, error, refetch: () => window.location.reload() };
};