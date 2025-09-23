
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

const ScheduledTransfers = () => {
  const { user } = useAuth();

  const { data: upcomingInvoices, isLoading } = useQuery({
    queryKey: ['upcoming-invoices', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Fetch upcoming due invoices and recurring invoices
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data: upcomingDue, error: dueError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            name,
            first_name,
            last_name,
            company
          )
        `)
        .eq('user_id', user.id)
        .eq('payment_status', 'unpaid')
        .gte('due_date', today)
        .lte('due_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5);
      
      if (dueError) throw dueError;
      
      // Fetch recurring invoices
      const { data: recurring, error: recurringError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            name,
            first_name,
            last_name,
            company
          )
        `)
        .eq('user_id', user.id)
        .eq('is_recurring', true)
        .limit(3);
      
      if (recurringError) throw recurringError;
      
      return {
        upcomingDue: upcomingDue || [],
        recurring: recurring || []
      };
    },
    enabled: !!user,
  });

  const getClientName = (client: any) => {
    if (!client) return 'Unknown Client';
    return client.name || 
           `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
           client.company || 
           'Unknown Client';
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Activities</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Activities</h3>
        <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
          View All
        </button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {/* Upcoming Due Invoices */}
          {upcomingInvoices?.upcomingDue?.map((invoice) => {
            const daysUntil = getDaysUntilDue(invoice.due_date);
            return (
              <div key={`due-${invoice.id}`} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-red-600" />
                    <span className="font-medium text-gray-900">Payment Due</span>
                  </div>
                  <span className="text-sm text-red-600 font-medium">
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {invoice.invoice_number} • {getClientName(invoice.clients)}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  ${(invoice.total_amount || 0).toFixed(2)}
                </p>
              </div>
            );
          })}
          
          {/* Recurring Invoices */}
          {upcomingInvoices?.recurring?.map((invoice) => (
            <div key={`recurring-${invoice.id}`} className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-blue-600" />
                  <span className="font-medium text-gray-900">Recurring Invoice</span>
                </div>
                <span className="text-sm text-blue-600 font-medium">
                  {invoice.recurring_frequency || 'Monthly'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {invoice.invoice_number} • {getClientName(invoice.clients)}
              </p>
              <p className="text-sm font-medium text-gray-900">
                ${(invoice.total_amount || 0).toFixed(2)}
              </p>
            </div>
          ))}
          
          {(!upcomingInvoices?.upcomingDue?.length && !upcomingInvoices?.recurring?.length) && (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">No upcoming activities</p>
              <p className="text-sm text-gray-500 mt-1">Invoices and payments will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ScheduledTransfers;
