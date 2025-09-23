import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Search, 
  Calendar, 
  FileText, 
  Share, 
  MoreHorizontal,
  Filter,
  Eye,
  Trash2,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportHistoryItem {
  id: string;
  name: string;
  template: string;
  status: 'completed' | 'generating' | 'failed';
  format: string;
  createdAt: string;
  dateRange: string;
  createdBy: string;
  size: string;
  downloads: number;
  shares: number;
}

export const ReportHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Mock data for demonstration - in a real app, this would come from an API
  const [reportHistory] = useState<ReportHistoryItem[]>([
    {
      id: '1',
      name: 'Q4 2023 Financial Report',
      template: 'Executive Summary',
      status: 'completed',
      format: 'PDF',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      dateRange: 'Oct-Dec 2023',
      createdBy: 'John Doe',
      size: '2.4 MB',
      downloads: 5,
      shares: 2
    },
    {
      id: '2',
      name: 'Client Performance Analysis',
      template: 'Client Performance',
      status: 'completed',
      format: 'CSV',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      dateRange: 'Last 6 months',
      createdBy: 'Jane Smith',
      size: '1.8 MB',
      downloads: 3,
      shares: 1
    },
    {
      id: '3',
      name: 'Monthly A/R Aging',
      template: 'A/R Aging Report',
      status: 'generating',
      format: 'PDF',
      createdAt: new Date().toISOString(),
      dateRange: 'Current month',
      createdBy: 'System',
      size: '0 MB',
      downloads: 0,
      shares: 0
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'generating':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FileText className="h-4 w-4" />;
      case 'generating':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'failed':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = reportHistory.filter((report: ReportHistoryItem) => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.template.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesType = filterType === 'all' || report.template === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalSize = reportHistory
    .filter((r: ReportHistoryItem) => r.status === 'completed')
    .reduce((sum: number, r: ReportHistoryItem) => sum + parseFloat(r.size.replace(' MB', '') || '0'), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Report History</h2>
          <p className="text-muted-foreground">
            View and manage your generated reports
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Bulk Download
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Reports</span>
            </div>
            <p className="text-2xl font-bold mt-1">{reportHistory.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Downloads</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {reportHistory.reduce((sum: number, r: ReportHistoryItem) => sum + r.downloads, 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Share className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Shares</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {reportHistory.reduce((sum: number, r: ReportHistoryItem) => sum + r.shares, 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Storage Used</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalSize.toFixed(1)} MB</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="Executive Summary">Executive Summary</SelectItem>
                <SelectItem value="A/R Aging Report">A/R Aging Report</SelectItem>
                <SelectItem value="Client Performance">Client Performance</SelectItem>
                <SelectItem value="Tax Summary">Tax Summary</SelectItem>
                <SelectItem value="Item/Service Performance">Item/Service Performance</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.map((report: ReportHistoryItem) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.status)}
                      <h3 className="font-medium">{report.name}</h3>
                    </div>
                    <Badge variant={getStatusColor(report.status)} className="text-xs">
                      {report.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {report.format}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                    <div>
                      Template: {report.template}
                    </div>
                    <div>
                      Range: {report.dateRange}
                    </div>
                    <div>
                      Created by: {report.createdBy}
                    </div>
                  </div>
                  
                  {report.status === 'completed' && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Size: {report.size}</span>
                      <span>•</span>
                      <span>{report.downloads} downloads</span>
                      <span>•</span>
                      <span>{report.shares} shares</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {report.status === 'completed' && (
                    <>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                  
                  {report.status === 'failed' && (
                    <Button variant="outline" size="sm">
                      Retry
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {report.status === 'completed' && (
                        <>
                          <DropdownMenuItem>
                            <Share className="h-4 w-4 mr-2" />
                            Share Report
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Duplicate Config
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Reports Generated</h3>
            <p className="text-muted-foreground">
              Your generated reports will appear here for easy access and management
            </p>
            <Button className="mt-4">
              <FileText className="h-4 w-4 mr-2" />
              Generate Your First Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};