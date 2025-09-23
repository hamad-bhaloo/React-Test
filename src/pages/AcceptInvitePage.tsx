import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Users, ArrowRight } from 'lucide-react';

const AcceptInvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { acceptInvitation } = useTeamMembers();
  const [accepting, setAccepting] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    if (!user) {
      // Redirect to auth page with invitation token
      navigate(`/auth?invitation=${token}`);
      return;
    }

    // Auto-accept invitation if user is logged in
    handleAccept();
  }, [token, user]);

  const handleAccept = async () => {
    if (!token || !user) return;

    setAccepting(true);
    try {
      const success = await acceptInvitation(token);
      setStatus(success ? 'success' : 'error');
    } catch (error) {
      setStatus('error');
    } finally {
      setAccepting(false);
    }
  };

  const handleContinue = () => {
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>
              Please sign in to accept this team invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate(`/auth?invitation=${token}`)}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Sign In to Accept
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            {status === 'success' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : status === 'error' || status === 'invalid' ? (
              <XCircle className="h-6 w-6 text-red-600" />
            ) : (
              <Users className="h-6 w-6 text-orange-600" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Accepting Invitation...'}
            {status === 'success' && 'Welcome to the Team!'}
            {status === 'error' && 'Invitation Error'}
            {status === 'invalid' && 'Invalid Invitation'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we process your invitation.'}
            {status === 'success' && 'You have successfully joined the team. You can now access the company dashboard and manage invoices.'}
            {status === 'error' && 'There was an error accepting your invitation. The invitation may have expired or already been used.'}
            {status === 'invalid' && 'This invitation link is invalid or malformed.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}
          {status === 'success' && (
            <Button 
              onClick={handleContinue}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Continue to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {(status === 'error' || status === 'invalid') && (
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Go to Sign In
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitePage;