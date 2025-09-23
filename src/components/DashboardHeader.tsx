
import { useState, useRef, useEffect } from "react";
import { Search, Menu, Bell, ChevronDown, LogOut, Crown, Building2, Loader, BellRing } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import NotificationModal from "./NotificationModal";
import LanguageModal from "./LanguageModal";
import SubscriptionModal from './SubscriptionModal';
import AIEnhancedSearch from './ai/AIEnhancedSearch';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const DashboardHeader = ({ onMenuClick, sidebarOpen }: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const { unreadCount } = useNotifications();
  const { subscription_tier, loading } = useSubscription();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { data: searchResults = [], isLoading: searchLoading } = useGlobalSearch(searchQuery);

  // Get user's display name and initials
  const userFullName = user?.user_metadata?.full_name || user?.email || 'User';
  const userInitials = userFullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  // Get language display
  const languageMap = {
    'en': 'EN',
    'es': 'ES', 
    'fr': 'FR',
    'de': 'DE',
    'it': 'IT',
    'pt': 'PT',
    'ja': 'JP',
    'zh': 'CN',
    'ar': 'ع'
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleCompanyClick = () => {
    navigate('/company');
  };

  const handleReminderLogsClick = () => {
    navigate('/reminder-logs');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.length >= 2);
  };

  const handleSearchFocus = () => {
    if (searchQuery.length >= 2) {
      setShowSearchResults(true);
    }
  };

  const closeSearchResults = () => {
    setShowSearchResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-4 py-2.5 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center ltr:space-x-3 rtl:space-x-reverse flex-1">
            <button
              onClick={onMenuClick}
              aria-label="Toggle sidebar"
              className="p-1.5 hover:bg-slate-100 rounded-md transition-all duration-200 hover:shadow-sm lg:hidden"
            >
              <Menu size={18} className="text-slate-600" />
            </button>
            
            <div className="flex-1 flex justify-center max-w-xl">
              <AIEnhancedSearch />
            </div>
          </div>
          
          <div className="flex items-center ltr:space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setShowSubscription(true)}
              className={`flex items-center ltr:space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 border ${
                loading 
                  ? 'bg-slate-50 text-slate-500 border-slate-200'
                  : subscription_tier === 'Free' 
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200/60 shadow-sm' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/60 shadow-sm'
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Crown size={14} />
                  <span>{subscription_tier}</span>
                </>
              )}
            </button>

            <button
              className="flex items-center ltr:space-x-1 rtl:space-x-reverse hover:bg-slate-100 rounded-md px-2 py-1.5 transition-all duration-200"
              onClick={() => setShowLanguages(true)}
            >
              <span className="text-xs font-medium text-slate-600">{languageMap[language as keyof typeof languageMap] || 'EN'}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
            
            {/* Notifications */}
            <NotificationModal />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center ltr:space-x-2 rtl:space-x-reverse hover:bg-slate-100 px-2 py-1.5 h-auto">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-primary-foreground text-xs font-semibold">{userInitials}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">{userFullName}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-lg border-slate-200">
                <DropdownMenuItem onClick={handleCompanyClick} className="hover:bg-slate-50">
                  <Building2 size={16} className="ltr:mr-2 rtl:ml-2 text-slate-500" />
                  Company
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReminderLogsClick} className="hover:bg-slate-50">
                  <BellRing size={16} className="ltr:mr-2 rtl:ml-2 text-slate-500" />
                  Reminder Logs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                  <LogOut size={16} className="ltr:mr-2 rtl:ml-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      
      <LanguageModal 
        isOpen={showLanguages} 
        onClose={() => setShowLanguages(false)} 
      />

      <SubscriptionModal 
        isOpen={showSubscription} 
        onClose={() => setShowSubscription(false)} 
      />
    </>
  );
};

export default DashboardHeader;
