import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ExternalLink, BellRing } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusVariant = (status: string) => {
  switch (status) {
    case 'success':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'attempted':
      return 'secondary';
    case 'skipped':
      return 'outline';
    default:
      return 'secondary';
  }
};

function useReminderLogs() {
  return useQuery({
    queryKey: ['reminder_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminder_logs')
        .select('id, created_at, status, message, error, attempt, invoice_id, function_name, type, metadata')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

const ReminderLogsPage: React.FC = () => {
  const { data, isLoading, error } = useReminderLogs();

  React.useEffect(() => {
    const title = 'Reminder Logs | Invoice Reminders';
    const desc = 'View status, attempts, and errors for your automated invoice reminder emails.';
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = desc;
      document.head.appendChild(m);
    }

    const linkCanonical = document.querySelector('link[rel="canonical"]');
    const href = window.location.origin + '/reminder-logs';
    if (linkCanonical) linkCanonical.setAttribute('href', href);
    else {
      const l = document.createElement('link');
      l.rel = 'canonical';
      l.href = href;
      document.head.appendChild(l);
    }
  }, []);

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BellRing className="h-5 w-5" /> Reminder Logs
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading logs...
            </div>
          ) : error ? (
            <div className="text-destructive">Failed to load logs.</div>
          ) : data && data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status) as any}>{row.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[420px] truncate" title={row.error ?? row.message ?? ''}>
                        {row.message || row.error || '-'}
                      </TableCell>
                      <TableCell>#{row.attempt ?? 0}</TableCell>
                      <TableCell>
                        {row.invoice_id ? (
                          <Link to={`/invoices/view/${row.invoice_id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                            Open <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          '-' 
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-muted-foreground">No reminder activity yet.</div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default ReminderLogsPage;
