import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Building2, User, MapPin, Loader } from 'lucide-react';

interface ClientAnalyticsProps {
  filters?: {
    clientType: string;
    status: string;
    industry: string;
  };
}

const ClientAnalytics = ({ filters }: ClientAnalyticsProps) => {
  const { user } = useAuth();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['client-analytics', user?.id, filters],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('clients')
        .select(`
          id, 
          client_type, 
          status, 
          industry, 
          country, 
          city,
          created_at,
          invoices:invoices(id, total_amount, payment_status)
        `)
        .eq('user_id', user.id);

      // Apply filters
      if (filters?.clientType && filters.clientType !== 'all') {
        query = query.eq('client_type', filters.clientType);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.industry && filters.industry !== 'all') {
        query = query.eq('industry', filters.industry);
      }

      const { data: clients, error } = await query;
      if (error) throw error;

      // Process data for charts
      const typeDistribution = clients.reduce((acc: any, client) => {
        const type = client.client_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const locationData = clients.reduce((acc: any, client) => {
        const country = client.country || 'Unknown';
        if (!acc[country]) {
          acc[country] = { country, clients: 0, revenue: 0 };
        }
        acc[country].clients += 1;
        
        // Calculate revenue from invoices
        if (client.invoices) {
          const revenue = client.invoices.reduce((sum: number, inv: any) => 
            sum + (inv.total_amount || 0), 0);
          acc[country].revenue += revenue;
        }
        return acc;
      }, {});

      const industryData = clients.reduce((acc: any, client) => {
        const industry = client.industry || 'Other';
        if (!acc[industry]) {
          acc[industry] = { industry, count: 0, revenue: 0 };
        }
        acc[industry].count += 1;
        
        if (client.invoices) {
          const revenue = client.invoices.reduce((sum: number, inv: any) => 
            sum + (inv.total_amount || 0), 0);
          acc[industry].revenue += revenue;
        }
        return acc;
      }, {});

      const colors = {
        individual: '#10b981',
        business: '#3b82f6',
        organization: '#8b5cf6',
        unknown: '#64748b'
      };

      return {
        typeData: Object.entries(typeDistribution).map(([type, count]) => ({
          name: type.charAt(0).toUpperCase() + type.slice(1),
          value: count,
          color: colors[type as keyof typeof colors] || '#64748b'
        })),
        locationData: Object.values(locationData).slice(0, 8),
        industryData: Object.values(industryData).slice(0, 6),
        totalClients: clients.length,
        totalRevenue: clients.reduce((sum, client) => {
          return sum + (client.invoices?.reduce((invSum: number, inv: any) => 
            invSum + (inv.total_amount || 0), 0) || 0);
        }, 0)
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm">
            <div className="h-48 flex items-center justify-center">
              <Loader size={20} className="animate-spin text-primary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Client Type Distribution */}
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Client Types
        </h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analyticsData?.typeData || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {analyticsData?.typeData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Locations */}
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-primary" />
          Top Locations
        </h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData?.locationData || []} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis 
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis 
                type="category"
                dataKey="country"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                width={60}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}
                formatter={(value, name) => [
                  name === 'clients' ? `${value} clients` : `$${Number(value).toLocaleString()}`,
                  name === 'clients' ? 'Clients' : 'Revenue'
                ]}
              />
              <Bar 
                dataKey="clients" 
                fill="#f97316" 
                radius={[0, 2, 2, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Industry Analysis */}
      <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-primary" />
          Industries
        </h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData?.industryData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis 
                dataKey="industry"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}
                formatter={(value, name) => [
                  name === 'count' ? `${value} clients` : `$${Number(value).toLocaleString()}`,
                  name === 'count' ? 'Clients' : 'Revenue'
                ]}
              />
              <Bar 
                dataKey="count" 
                fill="#10b981" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ClientAnalytics;