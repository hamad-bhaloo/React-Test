
import { TrendingUp, DollarSign, Clock, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useCurrency } from "@/contexts/CurrencyContext";
import { currencies } from "@/constants/currencies";

const StatsCards = () => {
  const navigate = useNavigate();
  const { selectedCurrency } = useCurrency();
  const { data: stats, isLoading, error } = useDashboardStats(selectedCurrency);
  
  // Get currency symbol
  const currencyInfo = currencies.find(c => c.code === selectedCurrency);
  const currencySymbol = currencyInfo?.symbol || '$';

  const getChangeDisplay = (change: number) => {
    const formattedChange = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    const changeType = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
    return { formattedChange, changeType };
  };

  const revenueChange = getChangeDisplay(stats?.changes?.revenueChange || 0);
  const debtChange = getChangeDisplay(stats?.changes?.debtCollectionChange || 0);
  const pendingChange = getChangeDisplay(stats?.changes?.pendingChange || 0);
  const receivedChange = getChangeDisplay(stats?.changes?.receivedChange || 0);

  const statsData = [
    {
      title: "Total Revenue",
      value: isLoading ? "Loading..." : `${currencySymbol}${stats?.totalInvoicesSent?.toFixed(2) || '0.00'}`,
      change: revenueChange.formattedChange,
      changeType: revenueChange.changeType,
      icon: TrendingUp,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      path: "/invoices"
    },
    {
      title: "Debt Collections",
      value: isLoading ? "Loading..." : `${currencySymbol}${stats?.debtCollectionAmount?.toFixed(2) || '0.00'}`,
      change: debtChange.formattedChange,
      changeType: debtChange.changeType,
      icon: DollarSign,
      gradient: "from-orange-500/10 to-orange-500/5",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600",
      path: "/invoices?tab=debt-collection"
    },
    {
      title: "Outstanding",
      value: isLoading ? "Loading..." : `${currencySymbol}${stats?.pendingPayments?.toFixed(2) || '0.00'}`,
      change: pendingChange.formattedChange,
      changeType: pendingChange.changeType,
      icon: Clock,
      gradient: "from-amber-500/10 to-amber-500/5",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600",
      path: "/invoices"
    },
    {
      title: "Revenue Received",
      value: isLoading ? "Loading..." : `${currencySymbol}${stats?.revenueReceived?.toFixed(2) || '0.00'}`,
      change: receivedChange.formattedChange,
      changeType: receivedChange.changeType,
      icon: Activity,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
      path: "/invoices"
    }
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  if (error) {
    console.error('StatsCards error:', error);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {statsData.map((stat, index) => (
        <div
          key={index}
          onClick={() => handleCardClick(stat.path)}
          className={`group bg-gradient-to-br ${stat.gradient} backdrop-blur-sm border border-slate-200/60 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:border-slate-300/60 transition-all duration-300 hover:scale-[1.02] h-[120px] flex flex-col`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon size={20} className={stat.iconColor} />
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              stat.changeType === 'positive' 
                ? 'bg-emerald-100 text-emerald-700' 
                : stat.changeType === 'negative'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {stat.changeType === 'positive' ? 
                <ArrowUpRight size={12} /> : 
                stat.changeType === 'negative' ?
                <ArrowDownRight size={12} /> :
                <Activity size={12} />
              }
              {stat.change}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end">
            <p className="text-xs font-medium text-slate-600 mb-1 line-clamp-1">
              {stat.title}
            </p>
            <p className="text-xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors line-clamp-1">
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
