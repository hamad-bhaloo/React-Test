import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  company_id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'active' | 'inactive';
  invited_by: string;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamInvitation {
  id: string;
  company_id: string;
  email: string;
  role: 'admin' | 'member';
  invited_by: string;
  invitation_token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export const useTeamMembers = (companyId?: string) => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = async () => {
    if (!companyId || !user) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data as TeamMember[] || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    }
  };

  const fetchInvitations = async () => {
    if (!companyId || !user) return;

    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('company_id', companyId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data as TeamInvitation[] || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    }
  };

  const inviteTeamMember = async (email: string, role: 'admin' | 'member' = 'member') => {
    console.log('Invite team member called with:', { email, role, companyId, user: user?.id });
    
    if (!companyId || !user) {
      console.error('Missing required data:', { companyId, userId: user?.id });
      toast.error('Company information not available. Please try again.');
      return false;
    }

    // Strict validation for companyId format and non-empty string
    if (typeof companyId !== 'string' || companyId.trim() === '') {
      console.error('Invalid company ID - empty string or wrong type:', { companyId, type: typeof companyId });
      toast.error('Invalid company information. Please refresh and try again.');
      return false;
    }

    // Additional validation for UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId.trim())) {
      console.error('Invalid company ID format:', { companyId: companyId.trim(), type: typeof companyId });
      toast.error('Invalid company ID format. Please refresh and try again.');
      return false;
    }

    try {
      console.log('Attempting to insert invitation with data:', {
        company_id: companyId,
        email,
        role,
        invited_by: user.id
      });
      
      // Debug: Log all the values before insertion
      console.log('Debug values:', {
        companyId_type: typeof companyId,
        companyId_value: companyId,
        companyId_length: companyId?.length,
        user_id_type: typeof user.id,
        user_id_value: user.id,
        user_id_length: user.id?.length,
        email_type: typeof email,
        email_value: email,
        role_type: typeof role,
        role_value: role
      });

      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          company_id: companyId,
          email: email.trim(),
          role,
          invited_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-team-invitation', {
          body: { invitationId: data.id }
        });

        if (emailError) {
          console.error('Error sending invitation email:', emailError);
          toast.error('Invitation created but email failed to send');
        } else {
          toast.success(`Invitation sent to ${email}`);
        }
      } catch (emailError) {
        console.error('Error calling invitation email function:', emailError);
        toast.error('Invitation created but email failed to send');
      }

      await fetchInvitations();
      return true;
    } catch (error: any) {
      console.error('Error inviting team member:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '23505') {
        toast.error('This email has already been invited');
      } else if (error.message?.includes('RLS')) {
        toast.error('Permission denied: You need admin access to invite team members');
      } else {
        toast.error(`Failed to send invitation: ${error.message || 'Unknown error'}`);
      }
      return false;
    }
  };

  const updateMemberRole = async (memberId: string, role: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member role updated');
      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Team member removed');
      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation cancelled');
      await fetchInvitations();
      return true;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
      return false;
    }
  };

  const acceptInvitation = async (token: string) => {
    if (!user) return false;

    try {
      // First get the invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('invitation_token', token)
        .is('accepted_at', null)
        .single();

      if (inviteError || !invitation) {
        toast.error('Invalid or expired invitation');
        return false;
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        toast.error('This invitation has expired');
        return false;
      }

      // Add user as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          company_id: invitation.company_id,
          user_id: user.id,
          email: user.email!,
          role: invitation.role,
          status: 'active',
          invited_by: invitation.invited_by,
          joined_at: new Date().toISOString()
        });

      if (memberError) throw memberError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      toast.success('Successfully joined the team!');
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTeamMembers(), fetchInvitations()]);
      setLoading(false);
    };

    if (companyId && user) {
      loadData();
    }
  }, [companyId, user]);

  return {
    teamMembers,
    invitations,
    loading,
    inviteTeamMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    acceptInvitation,
    refresh: () => Promise.all([fetchTeamMembers(), fetchInvitations()])
  };
};