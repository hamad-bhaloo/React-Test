
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const SummarySection = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

  console.log('SummarySection - isLoading:', isLoading, 'error:', error, 'stats:', stats);

  // Calculate summary data from real statistics
  const totalClients = stats?.clientsCount || 0;
  const pendingInvoices = stats?.invoices?.filter(inv => inv.status === 'sent' || inv.status === 'viewed').length || 0;
  const totalInvoices = stats?.invoices?.length || 0;
  const pendingPayments = stats?.invoices?.filter(inv => inv.payment_status === 'unpaid' || inv.payment_status === 'partially_paid').length || 0;

  const data = [
    { name: "Total Clients", value: totalClients, color: "#F97316" },
    { name: "Pending Invoices", value: pendingInvoices, color: "#3B82F6" },
    { name: "Total Invoices", value: totalInvoices, color: "#1F2937" },
    { name: "Pending Payments", value: pendingPayments, color: "#6B7280" }
  ];

  const summaryStats = [
    { label: "Total Clients", value: totalClients.toString(), color: "text-orange-500" },
    { label: "Pending Invoices", value: pendingInvoices.toString(), color: "text-blue-500" },
    { label: "Total Invoices", value: totalInvoices.toString(), color: "text-gray-800" },
    { label: "Pending Payments", value: pendingPayments.toString(), color: "text-gray-600" }
  ];

  // Calculate growth percentage
  const revenueReceived = stats?.revenueReceived || 0;
  const totalInvoicesSent = stats?.totalInvoicesSent || 0;
  const growthPercentage = totalInvoicesSent > 0 ? ((revenueReceived / totalInvoicesSent) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('SummarySection error:', error);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <span className="text-lg">⋯</span>
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Payment completion rate of {growthPercentage}%</p>
      </div>
      
      <div className="relative h-48 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-3">
        {summaryStats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                index === 0 ? 'bg-orange-500' :
                index === 1 ? 'bg-blue-500' :
                index === 2 ? 'bg-gray-800' : 'bg-gray-600'
              }`}></div>
              <span className="text-sm text-gray-600">{stat.label}</span>
            </div>
            <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummarySection;
