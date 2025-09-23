import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Plus, Phone, Mail, MessageSquare, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDebtCollection, useUpdateDebtCollection, useAddCollectionActivity } from '@/hooks/useDebtCollections';

interface DebtCollectionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debtCollectionId: string;
}

export const DebtCollectionDetailsModal = ({ 
  open, 
  onOpenChange, 
  debtCollectionId 
}: DebtCollectionDetailsModalProps) => {
  const { data: debtCollection, isLoading } = useDebtCollection(debtCollectionId);
  const updateMutation = useUpdateDebtCollection();
  const addActivityMutation = useAddCollectionActivity();

  const [newActivity, setNewActivity] = useState({
    activity_type: '',
    description: '',
    contact_method: '',
    outcome: '',
    amount: '',
    next_action: '',
    next_action_date: undefined as Date | undefined,
  });

  const [editData, setEditData] = useState({
    status: '',
    priority: '',
    collection_notes: '',
    amount_collected: '',
  });

  React.useEffect(() => {
    if (debtCollection) {
      setEditData({
        status: debtCollection.status,
        priority: debtCollection.priority,
        collection_notes: debtCollection.collection_notes || '',
        amount_collected: debtCollection.amount_collected?.toString() || '0',
      });
    }
  }, [debtCollection]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addActivityMutation.mutateAsync({
        debt_collection_id: debtCollectionId,
        activity_type: newActivity.activity_type,
        description: newActivity.description,
        contact_method: newActivity.contact_method || null,
        outcome: newActivity.outcome || null,
        amount: newActivity.amount ? parseFloat(newActivity.amount) : null,
        next_action: newActivity.next_action || null,
        next_action_date: newActivity.next_action_date ? format(newActivity.next_action_date, 'yyyy-MM-dd') : null,
      });

      // Update contact attempts and last contact date
      const updateData: any = {
        contact_attempts: (debtCollection?.contact_attempts || 0) + 1,
        last_contact_date: format(new Date(), 'yyyy-MM-dd'),
      };

      if (newActivity.next_action_date) {
        updateData.next_action_date = format(newActivity.next_action_date, 'yyyy-MM-dd');
      }

      await updateMutation.mutateAsync({
        id: debtCollectionId,
        data: updateData,
      });

      // Reset form
      setNewActivity({
        activity_type: '',
        description: '',
        contact_method: '',
        outcome: '',
        amount: '',
        next_action: '',
        next_action_date: undefined,
      });
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const handleUpdateDebtCollection = async () => {
    try {
      await updateMutation.mutateAsync({
        id: debtCollectionId,
        data: {
          status: editData.status,
          priority: editData.priority,
          collection_notes: editData.collection_notes,
          amount_collected: parseFloat(editData.amount_collected) || 0,
        },
      });
    } catch (error) {
      console.error('Error updating debt collection:', error);
    }
  };

  if (isLoading || !debtCollection) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const invoice = debtCollection.invoices;
  const client = invoice?.clients;
  const activities = debtCollection.debt_collection_activities || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Debt Collection Case - Invoice #{invoice?.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="edit">Edit Case</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p>{client?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p>{client?.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p>{client?.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p>{client?.company || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Original Amount</Label>
                  <p className="text-lg font-semibold">${invoice?.total_amount?.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Paid Amount</Label>
                  <p className="text-lg font-semibold text-green-600">${invoice?.paid_amount?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Collected</Label>
                  <p className="text-lg font-semibold text-blue-600">${debtCollection.amount_collected?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Outstanding</Label>
                  <p className="text-lg font-semibold text-red-600">
                    ${Math.max(0, (invoice?.total_amount || 0) - (invoice?.paid_amount || 0)).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Case Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Case Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Badge variant="outline">{debtCollection.status.replace('_', ' ').toUpperCase()}</Badge>
                  <Badge variant="outline">{debtCollection.priority.toUpperCase()}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Contact Attempts</Label>
                    <p>{debtCollection.contact_attempts || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Contact</Label>
                    <p>{debtCollection.last_contact_date ? format(new Date(debtCollection.last_contact_date), 'MMM dd, yyyy') : 'Never'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Next Action</Label>
                    <p>{debtCollection.next_action_date ? format(new Date(debtCollection.next_action_date), 'MMM dd, yyyy') : 'Not scheduled'}</p>
                  </div>
                </div>
                {debtCollection.collection_notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm text-muted-foreground mt-1">{debtCollection.collection_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            {/* Add New Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Log New Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddActivity} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Activity Type *</Label>
                      <Select 
                        value={newActivity.activity_type} 
                        onValueChange={(value) => setNewActivity(prev => ({ ...prev, activity_type: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone_call">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="letter">Letter</SelectItem>
                          <SelectItem value="visit">Site Visit</SelectItem>
                          <SelectItem value="payment">Payment Received</SelectItem>
                          <SelectItem value="settlement">Settlement Agreement</SelectItem>
                          <SelectItem value="legal_action">Legal Action</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Contact Method</Label>
                      <Select 
                        value={newActivity.contact_method} 
                        onValueChange={(value) => setNewActivity(prev => ({ ...prev, contact_method: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Contact method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="letter">Letter</SelectItem>
                          <SelectItem value="in_person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      value={newActivity.description}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the activity..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Outcome</Label>
                      <Input
                        value={newActivity.outcome}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, outcome: e.target.value }))}
                        placeholder="e.g., Left voicemail, Payment promised"
                      />
                    </div>
                    <div>
                      <Label>Amount (if payment)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newActivity.amount}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Next Action</Label>
                      <Input
                        value={newActivity.next_action}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, next_action: e.target.value }))}
                        placeholder="e.g., Follow up call"
                      />
                    </div>
                    <div>
                      <Label>Next Action Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newActivity.next_action_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newActivity.next_action_date ? format(newActivity.next_action_date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newActivity.next_action_date}
                            onSelect={(date) => setNewActivity(prev => ({ ...prev, next_action_date: date }))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Button type="submit" disabled={addActivityMutation.isPending}>
                    {addActivityMutation.isPending ? 'Adding...' : 'Add Activity'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Activities History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No activities recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="border-l-2 border-muted pl-4 pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{activity.activity_type.replace('_', ' ')}</Badge>
                            {activity.contact_method && (
                              <Badge variant="secondary">{activity.contact_method}</Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{activity.description}</p>
                        {activity.outcome && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Outcome:</strong> {activity.outcome}
                          </p>
                        )}
                        {activity.amount && (
                          <p className="text-sm text-green-600 mb-1">
                            <strong>Amount:</strong> ${activity.amount}
                          </p>
                        )}
                        {activity.next_action && (
                          <p className="text-sm text-blue-600">
                            <strong>Next Action:</strong> {activity.next_action}
                            {activity.next_action_date && ` (${format(new Date(activity.next_action_date), 'MMM dd, yyyy')})`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Edit Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select 
                      value={editData.status} 
                      onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                        <SelectItem value="settled">Settled</SelectItem>
                        <SelectItem value="written_off">Written Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select 
                      value={editData.priority} 
                      onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Amount Collected</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.amount_collected}
                    onChange={(e) => setEditData(prev => ({ ...prev, amount_collected: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Collection Notes</Label>
                  <Textarea
                    value={editData.collection_notes}
                    onChange={(e) => setEditData(prev => ({ ...prev, collection_notes: e.target.value }))}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleUpdateDebtCollection}
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Case'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};