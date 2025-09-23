
import { useAuth } from '@/contexts/AuthContext';
import { useCompanySetup } from '@/hooks/useCompanySetup';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasCompany, loading: companyLoading } = useCompanySetup();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const location = useLocation();

  console.log('ProtectedRoute - Auth loading:', authLoading, 'Company loading:', companyLoading, 'Role loading:', roleLoading);
  console.log('ProtectedRoute - User:', !!user, 'Has company:', hasCompany, 'Is admin:', isAdmin);
  console.log('ProtectedRoute - Current path:', location.pathname);
  console.log('ProtectedRoute - User ID:', user?.id);
  console.log('ProtectedRoute - Company loading details:', { companyLoading, hasCompany });

  if (authLoading || companyLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Allow access to company page even without company setup
  if (location.pathname === '/company') {
    console.log('ProtectedRoute - On company page, allowing access');
    return <>{children}</>;
  }

  // Admin users don't need company setup - skip company check for admins
  if (isAdmin) {
    console.log('ProtectedRoute - Admin user, skipping company check');
    return <>{children}</>;
  }

  // Only redirect to company page if we have a regular user, not loading, and definitely don't have a company
  if (!companyLoading && !hasCompany) {
    console.log('ProtectedRoute - No company, redirecting to company setup');
    return <Navigate to="/company" replace />;
  }

  // If we have a company or are still loading, allow access to all pages
  console.log('ProtectedRoute - All checks passed, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
