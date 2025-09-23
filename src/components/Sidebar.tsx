
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Crown,
  Zap,
  Wallet,
  Link2,
  AlertTriangle,
  Quote,
  Palette,
  Calculator,
  BarChart3,
  Code,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useSubscription } from '@/hooks/useSubscription';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const { t } = useLanguage();
  const { settings } = useUserSettings();
  const { subscribed } = useSubscription();

  // Check if POS is enabled for this user
  const isPOSEnabled = subscribed && settings?.pos_enabled === true;

  const mainMenuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/', enabled: true },
    { icon: Users, label: t('nav.clients'), path: '/clients', enabled: true },
    { icon: Quote, label: 'Quotations', path: '/quotations', enabled: true },
    { icon: FileText, label: t('nav.invoices'), path: '/invoices', enabled: true },
    { icon: AlertTriangle, label: 'Expenses', path: '/expenses', enabled: true },
    { icon: Calculator, label: 'POS System', path: '/pos-system', enabled: isPOSEnabled },
    { icon: BarChart3, label: 'Reports', path: '/reports', enabled: true },
    { icon: Palette, label: 'Templates', path: '/invoice-templates', enabled: true },
    { icon: Wallet, label: 'Wallet', path: '/wallet', enabled: false, comingSoon: true },
  ];

  const developmentMenuItems = [
    { icon: Code, label: 'API Documentation', path: '/api-docs', enabled: true },
    { icon: Link2, label: 'Integrations', path: '/integrations', enabled: true },
  ];


  const footerMenuItems = [
    { icon: Crown, label: 'Subscription', path: '/subscription', enabled: true },
    { icon: Settings, label: t('nav.settings'), path: '/settings', enabled: true },
  ];

  return (
    <aside className={`bg-gradient-to-b from-slate-50 to-white border-r border-slate-200/60 shadow-lg backdrop-blur-sm flex flex-col h-screen fixed top-0 z-30
      ltr:left-0 
      rtl:right-0 rtl:border-l rtl:border-r-0
      w-60 transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 ${isOpen ? 'lg:w-60' : 'lg:w-14'}`}>
      
      {/* Logo Section */}
      <div className="px-3 py-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <img 
            src="/lovable-uploads/32e73677-3782-44aa-90ba-0dbb1f4e5012.png" 
            alt="X Invoice Logo" 
            className={`${isOpen ? 'h-8' : 'h-6'} object-contain transition-all duration-300`}
          />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <ul className="space-y-1">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                {item.enabled ? (
                  <NavLink
                    to={item.path}
                    className={`group flex items-center px-2.5 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 hover:shadow-sm'
                    }`}
                  >
                     <Icon size={isOpen ? 18 : 20} className={`${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-700'} transition-colors`} />
                     {isOpen && <span className="ltr:ml-2.5 rtl:mr-2.5 text-sm font-medium">{item.label}</span>}
                  </NavLink>
                ) : (
                  <div className={`flex items-center px-2.5 py-2 rounded-lg cursor-not-allowed opacity-40 text-slate-400`}>
                    <Icon size={isOpen ? 18 : 20} />
                     {isOpen && (
                       <div className="ltr:ml-2.5 rtl:mr-2.5 flex items-center gap-2">
                         <span className="text-sm">{item.label}</span>
                         {item.comingSoon && (
                           <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">
                             Soon
                           </span>
                         )}
                       </div>
                     )}
                  </div>
                )}
              </li>
            );
          })}

        </ul>
      </nav>

      {/* Footer Section */}
      <div className="px-2 pb-3 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <ul className="space-y-1 pt-3">
          {/* Development Section */}
          {developmentMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`group flex items-center px-2.5 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                   <Icon size={isOpen ? 18 : 20} className={`${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-700'} transition-colors`} />
                   {isOpen && <span className="ltr:ml-2.5 rtl:mr-2.5 text-sm font-medium">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
          
          {/* Separator */}
          <li className="py-1">
            <div className="border-t border-slate-200/60"></div>
          </li>
          
          {footerMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`group flex items-center px-2.5 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                   <Icon size={isOpen ? 18 : 20} className={`${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-700'} transition-colors`} />
                   {isOpen && <span className="ltr:ml-2.5 rtl:mr-2.5 text-sm font-medium">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
