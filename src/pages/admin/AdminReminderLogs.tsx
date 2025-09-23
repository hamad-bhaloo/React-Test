import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarDays, Mail, Users, AlertCircle, RefreshCw } from 'lucide-react';

interface ReminderLog {
  id: string;
  user_id: string;
  reminder_type: string;
  sent_at: string;
  email_sent: boolean;
  email_error?: string;
  profiles?: {
    email: string;
    full_name?: string;
  };
}

const reminderTypeLabels = {
  'no_invoice_3d': '3-Day Reminder',
  'no_invoice_5d': '5-Day Reminder', 
  'no_invoice_7d': '7-Day Reminder',
  'monthly_marketing': 'Monthly Marketing'
};

export default function AdminReminderLogs() {
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    document.title = 'Reminder Logs - Admin | X Invoice';
    fetchReminderLogs();
  }, []);

  const fetchReminderLogs = async () => {
    try {
      setLoading(true);
      
      const { data: logsData, error: logsError } = await supabase
        .from('user_reminder_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(200);

      if (logsError) throw logsError;

      const userIds = [...new Set(logsData?.map(log => log.user_id) || [])];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);
      const enrichedLogs: ReminderLog[] = logsData?.map(log => ({
        ...log,
        profiles: profilesMap.get(log.user_id) || { email: 'Unknown', full_name: 'Unknown User' }
      })) || [];

      setLogs(enrichedLogs);
    } catch (error: any) {
      console.error('Error fetching reminder logs:', error);
      toast.error('Failed to fetch reminder logs');
    } finally {
      setLoading(false);
    }
  };

  const triggerReminderCheck = async () => {
    try {
      setTriggering(true);
      const { data, error } = await supabase.functions.invoke('send-no-invoice-reminder');
      if (error) throw error;
      toast.success(`Reminder check completed: ${data.emailsSent} emails sent`);
      setTimeout(() => fetchReminderLogs(), 2000);
    } catch (error: any) {
      console.error('Error triggering reminders:', error);
      toast.error('Failed to trigger reminder check');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading reminder logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reminder Logs</h1>
          <p className="text-muted-foreground">Monitor automated reminder email activity</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchReminderLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={triggerReminderCheck} disabled={triggering} size="sm">
            {triggering ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Trigger Check
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reminder Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reminder logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent At</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(log.sent_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {log.profiles?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {reminderTypeLabels[log.reminder_type as keyof typeof reminderTypeLabels] || log.reminder_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.email_sent ? 'default' : 'destructive'}>
                        {log.email_sent ? 'Sent' : 'Failed'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}