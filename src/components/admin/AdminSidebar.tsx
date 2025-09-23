import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText,
  Settings,
  LogOut,
  BarChart3,
  Mail
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
}

const AdminSidebar = ({ isOpen }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Mail, label: 'Reminder Logs', path: '/admin/reminder-logs' },
    { icon: FileText, label: 'Invoices', path: '/admin/invoices' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <aside className={`bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30 transition-transform duration-300
      w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isOpen ? 'lg:w-64' : 'lg:w-16'}`}>
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-center">
          <div className={`${isOpen ? 'flex items-center gap-3' : 'flex justify-center'}`}>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {isOpen && <span className="font-semibold text-lg">Admin Panel</span>}
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={isOpen ? 20 : 24} />
                  {isOpen && <span className="ml-3">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={signOut}
          className="flex items-center w-full px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut size={isOpen ? 20 : 24} />
          {isOpen && <span className="ml-3">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;