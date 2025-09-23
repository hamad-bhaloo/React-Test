import React, { useState } from 'react';
import { X, UserPlus, Mail, Shield, User, Crown, Trash2, Calendar } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

const TeamMembersModal = ({ isOpen, onClose, companyId }: TeamMembersModalProps) => {
  console.log('TeamMembersModal rendered with companyId:', companyId);
  const { subscribed, subscription_tier } = useSubscription();
  const { teamMembers, invitations, loading, inviteTeamMember, updateMemberRole, removeMember, cancelInvitation } = useTeamMembers(companyId);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);

  // Early return if modal is not open or companyId is invalid
  if (!isOpen) return null;
  
  if (!companyId || companyId.trim() === '') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Information Missing</h3>
            <p className="text-gray-600 mb-4">Unable to load team members. Please refresh the page and try again.</p>
            <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-600">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleInvite = async () => {
    if (!companyId) {
      toast.error('Company information not available. Please refresh the page.');
      return;
    }

    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!subscribed) {
      toast.error('Team members feature is only available for paid accounts');
      return;
    }

    setInviting(true);
    const success = await inviteTeamMember(inviteEmail.trim(), inviteRole);
    if (success) {
      setInviteEmail('');
      setInviteRole('member');
    }
    setInviting(false);
  };

  const handleRoleUpdate = async (memberId: string, newRole: 'admin' | 'member') => {
    await updateMemberRole(memberId, newRole);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      await removeMember(memberId);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      await cancelInvitation(invitationId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
            <p className="text-gray-600 mt-1">
              Manage your team and collaborate on invoices
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!subscribed && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <Crown className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <h3 className="font-medium text-orange-800">Upgrade Required</h3>
                  <p className="text-sm text-orange-600 mt-1">
                    Team members feature is only available for paid accounts. Upgrade your plan to start collaborating with your team.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invite Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </h3>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={!subscribed}
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={(value: 'member' | 'admin') => setInviteRole(value)} disabled={!subscribed}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleInvite}
                disabled={inviting || !subscribed}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {inviting ? 'Inviting...' : 'Invite'}
              </Button>
            </div>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Pending Invitations ({invitations.length})
              </h3>
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-yellow-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{invitation.email}</p>
                        <p className="text-sm text-gray-600">
                          Invited {format(new Date(invitation.created_at), 'MMM d, yyyy')} • 
                          Expires {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-yellow-300">
                        {invitation.role}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Team Members ({teamMembers.length})
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading team members...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No team members yet</p>
                <p className="text-sm text-gray-500">Invite your first team member to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      {member.role === 'admin' ? (
                        <Shield className="h-4 w-4 text-orange-600 mr-3" />
                      ) : (
                        <User className="h-4 w-4 text-gray-600 mr-3" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{member.email}</p>
                        <p className="text-sm text-gray-600">
                          {member.joined_at ? (
                            `Joined ${format(new Date(member.joined_at), 'MMM d, yyyy')}`
                          ) : (
                            'Pending'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value: 'admin' | 'member') => handleRoleUpdate(member.id, value)}
                        disabled={!subscribed}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={!subscribed}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p><strong>Roles:</strong></p>
              <p>• <strong>Admin:</strong> Can manage team members and all company data</p>
              <p>• <strong>Member:</strong> Can access and manage company invoices and clients</p>
            </div>
            <Button onClick={onClose} variant="outline">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMembersModal;