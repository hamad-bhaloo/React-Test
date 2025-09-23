
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import Dashboard from "@/components/Dashboard";
import confetti from 'canvas-confetti';
import { useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  // Auto-refresh dashboard data when navigating to this page
  useEffect(() => {
    // Invalidate dashboard stats to ensure fresh data when user returns to dashboard
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  }, [queryClient]);

  // Check for onboarding completion confetti - runs for all users
  useEffect(() => {
    const shouldShowConfetti = localStorage.getItem('showOnboardingConfetti');
    console.log('Checking for confetti flag:', shouldShowConfetti);
    
    if (shouldShowConfetti === 'true') {
      // Remove the flag
      localStorage.removeItem('showOnboardingConfetti');
      console.log('Triggering onboarding confetti...');
      
      // Trigger confetti with a delay to ensure page is fully loaded
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
        }, 200);
        
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 400);
      }, 1000);
    }
  }, []);

  // Don't render anything for admin users as they'll be redirected
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (isAdmin) {
    return null; // Will be redirected
  }

  return <Dashboard />;
};

export default Index;
