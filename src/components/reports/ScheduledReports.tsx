import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Mail, 
  MoreHorizontal,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ScheduledReports = () => {
  const [scheduledReports] = useState([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Scheduled Reports</h2>
          <p className="text-muted-foreground">
            Automate report generation and delivery
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Schedules</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {scheduledReports.filter(r => r.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <p className="text-2xl font-bold mt-1">3</p>
            <p className="text-xs text-muted-foreground">reports due</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last Month</span>
            </div>
            <p className="text-2xl font-bold mt-1">24</p>
            <p className="text-xs text-muted-foreground">reports sent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Recipients</span>
            </div>
            <p className="text-2xl font-bold mt-1">12</p>
            <p className="text-xs text-muted-foreground">unique emails</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reports List */}
      <div className="space-y-4">
        {scheduledReports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{report.name}</h3>
                    <Badge variant={getStatusColor(report.status)} className="text-xs">
                      {report.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {report.format}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{report.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Next: {formatDate(report.nextRun)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{report.recipients.length} recipient(s)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Template: {report.template}</span>
                    <span>•</span>
                    <span>Last run: {formatDate(report.lastRun)}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {report.recipients.slice(0, 3).map((email, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                        {email}
                      </Badge>
                    ))}
                    {report.recipients.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        +{report.recipients.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={report.status === 'paused'}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Run Now
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {report.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Schedule
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Resume Schedule
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Manage Recipients
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Schedule
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {scheduledReports.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Scheduled Reports</h3>
            <p className="text-muted-foreground mb-4">
              Create your first scheduled report to automate your reporting workflow
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};