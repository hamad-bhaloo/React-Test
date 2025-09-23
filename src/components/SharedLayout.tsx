
import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanySetup } from '@/hooks/useCompanySetup';
import { useUserRole } from '@/hooks/useUserRole';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import PlanLimitBanner from './PlanLimitBanner';
import OnboardingPage from '@/pages/OnboardingPage';

const SharedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { hasCompany, loading: companyLoading } = useCompanySetup();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state based on screen size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (authLoading || companyLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin users don't need company setup - skip onboarding for them
  if (!isAdmin && !hasCompany) {
    return <OnboardingPage />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-14'}`}>
        {/* Plan Limit Banner */}
        <PlanLimitBanner />
        
        {/* Header */}
        <DashboardHeader onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SharedLayout;
