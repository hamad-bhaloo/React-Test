
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useCompanySetup } from '@/hooks/useCompanySetup';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { hasCompany, loading: companyLoading } = useCompanySetup();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  if (companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ltr:ml-60 rtl:mr-60' : 'ltr:ml-14 rtl:mr-14'}`}>
        <DashboardHeader onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
