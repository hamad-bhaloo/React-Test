import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, subDays, subMonths, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { generatePDFReport, generateReportCSV } from '@/utils/pdfExport';

export interface ReportConfig {
  title: string;
  description: string;
  template: string;
  dateRange: string;
  customDateFrom?: Date | null;
  customDateTo?: Date | null;
  filters: {
    clients: string[];
    status: string;
    paymentStatus: string;
    currency: string;
    tags: string[];
    amountMin: string;
    amountMax: string;
    includeDrafts: boolean;
    includeDeleted: boolean;
    groupByClient: boolean;
  };
  components: {
    charts: string[];
    tables: string[];
    narrativeAnalysis: boolean;
    coverPage: boolean;
    tableOfContents: boolean;
    appendices: boolean;
  };
  styling: {
    theme: string;
    logo: string;
    watermark: string;
    headerFooter: boolean;
  };
}

export interface ReportData {
  summary: {
    totalInvoices: number;
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    totalOverdue: number;
    averageInvoiceValue: number;
    collectionRate: number;
  };
  trends: {
    monthlyRevenue: Array<{ month: string; amount: number; count: number }>;
    paymentTrends: Array<{ month: string; paid: number; unpaid: number }>;
    clientGrowth: Array<{ month: string; newClients: number; totalClients: number }>;
  };
  aging: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
  };
  topClients: Array<{
    clientId: string;
    clientName: string;
    totalBilled: number;
    totalPaid: number;
    invoiceCount: number;
    averagePaymentDays: number;
  }>;
  topItems: Array<{
    itemName: string;
    quantity: number;
    totalRevenue: number;
    averagePrice: number;
  }>;
  narrative: {
    keyInsights: string[];
    recommendations: string[];
    risks: string[];
    opportunities: string[];
  };
}

const defaultConfig: ReportConfig = {
  title: 'Financial Performance Report',
  description: 'Comprehensive analysis of business performance',
  template: 'executive-summary',
  dateRange: 'last-12-months',
  customDateFrom: null,
  customDateTo: null,
  filters: {
    clients: [],
    status: 'all',
    paymentStatus: 'all',
    currency: 'all',
    tags: [],
    amountMin: '',
    amountMax: '',
    includeDrafts: false,
    includeDeleted: false,
    groupByClient: false,
  },
  components: {
    charts: ['revenue-trends', 'payment-status', 'aging-analysis'],
    tables: ['top-clients', 'recent-invoices', 'overdue-invoices'],
    narrativeAnalysis: true,
    coverPage: true,
    tableOfContents: true,
    appendices: false,
  },
  styling: {
    theme: 'professional',
    logo: '',
    watermark: '',
    headerFooter: true,
  },
};

export const useReportBuilder = () => {
  const { user } = useAuth();
  const [reportConfig, setReportConfig] = useState<ReportConfig>(defaultConfig);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const updateConfig = useCallback((updates: Partial<ReportConfig>) => {
    setReportConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const getDateRange = useCallback(() => {
    const now = new Date();
    
    switch (reportConfig.dateRange) {
      case 'last-7-days':
        return { from: subDays(now, 7), to: now };
      case 'last-30-days':
        return { from: subDays(now, 30), to: now };
      case 'last-3-months':
        return { from: subMonths(now, 3), to: now };
      case 'last-6-months':
        return { from: subMonths(now, 6), to: now };
      case 'last-12-months':
        return { from: subMonths(now, 12), to: now };
      case 'this-year':
        return { from: startOfYear(now), to: endOfYear(now) };
      case 'last-year':
        const lastYear = subMonths(now, 12);
        return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
      case 'custom':
        return { 
          from: reportConfig.customDateFrom || subMonths(now, 3), 
          to: reportConfig.customDateTo || now 
        };
      default:
        return { from: subMonths(now, 3), to: now };
    }
  }, [reportConfig.dateRange, reportConfig.customDateFrom, reportConfig.customDateTo]);

  const buildQuery = useCallback(async () => {
    const { from, to } = getDateRange();
    
    // First get POS-generated invoice IDs to exclude them
    const { data: posInvoices, error: posError } = await supabase
      .from('pos_sales')
      .select('invoice_id')
      .eq('user_id', user?.id)
      .not('invoice_id', 'is', null);
    
    if (posError) throw posError;
    
    const posInvoiceIds = new Set(posInvoices?.map(sale => sale.invoice_id) || []);
    
    let query = supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          name,
          first_name,
          last_name,
          company,
          email
        ),
        invoice_items (
          product_name,
          quantity,
          rate,
          amount
        ),
        payments (
          payment_date,
          amount
        )
      `)
      .eq('user_id', user?.id)
      .gte('issue_date', format(from, 'yyyy-MM-dd'))
      .lte('issue_date', format(to, 'yyyy-MM-dd'));

    // Apply filters
    if (reportConfig.filters.status !== 'all') {
      query = query.eq('status', reportConfig.filters.status);
    }

    if (reportConfig.filters.paymentStatus !== 'all') {
      query = query.eq('payment_status', reportConfig.filters.paymentStatus);
    }

    if (reportConfig.filters.currency !== 'all') {
      query = query.eq('currency', reportConfig.filters.currency);
    }

    if (!reportConfig.filters.includeDrafts) {
      query = query.neq('status', 'draft');
    }

    if (!reportConfig.filters.includeDeleted) {
      query = query.neq('status', 'deleted');
    }

    if (reportConfig.filters.amountMin) {
      query = query.gte('total_amount', parseFloat(reportConfig.filters.amountMin));
    }

    if (reportConfig.filters.amountMax) {
      query = query.lte('total_amount', parseFloat(reportConfig.filters.amountMax));
    }

    return { query, posInvoiceIds };
  }, [user?.id, reportConfig, getDateRange]);

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting report generation...');
      const { query, posInvoiceIds } = await buildQuery();
      const { data: allInvoices, error } = await query;
      
      if (error) {
        console.error('Database query error:', error);
        throw new Error(`Failed to fetch invoice data: ${error.message}`);
      }

      if (!allInvoices) {
        console.warn('No invoice data found');
        throw new Error('No invoice data found for the selected period');
      }

      console.log('Fetched invoices:', allInvoices.length);
      console.log('POS invoice IDs to exclude:', posInvoiceIds.size);

      // Filter out POS-generated invoices
      const invoices = allInvoices.filter(invoice => !posInvoiceIds.has(invoice.id));
      console.log('Invoices after filtering POS:', invoices.length);

      // Process the raw data into report format
      const processedData = processInvoiceData(invoices);
      console.log('Processed report data:', processedData.summary);
      return processedData;
    },
    onSuccess: (data) => {
      console.log('Report generation successful:', data.summary);
      setReportData(data);
      toast.success(`Report generated successfully with ${data.summary.totalInvoices} invoices`);
    },
    onError: (error) => {
      console.error('Report generation error:', error);
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });

  const exportReportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'xlsx' | 'csv') => {
      console.log('Starting export with format:', format);
      console.log('Report data available:', !!reportData);
      
      if (!reportData) {
        throw new Error('No report data available for export. Please generate a report first.');
      }

      // Validate report data has required fields
      if (!reportData.summary || reportData.summary.totalInvoices === undefined) {
        throw new Error('Report data is incomplete. Please regenerate the report.');
      }

      if (format === 'pdf') {
        console.log('Generating PDF with data:', reportData.summary);
        await generatePDFReport(reportData, {
          title: reportConfig.title,
          description: reportConfig.description,
          includeCoverPage: reportConfig.components.coverPage,
          includeTableOfContents: reportConfig.components.tableOfContents,
        });
        return { format: 'pdf' };
      } 
      
      if (format === 'csv') {
        console.log('Generating CSV with data:', reportData.summary);
        generateReportCSV(reportData);
        return { format: 'csv' };
      }
      
      if (format === 'xlsx') {
        console.log('Generating XLSX (as CSV) with data:', reportData.summary);
        // For now, export as CSV until we implement XLSX
        generateReportCSV(reportData);
        return { format: 'csv (XLSX coming soon)' };
      }
      
      throw new Error('Unsupported export format');
    },
    onSuccess: (result) => {
      console.log('Export successful:', result);
      toast.success(`Report exported as ${result.format}`);
    },
    onError: (error) => {
      console.error('Export error:', error);
      toast.error(`Failed to export report: ${error.message}`);
    },
  });

  const generateReport = useCallback(() => {
    return generateReportMutation.mutate();
  }, [generateReportMutation]);

  const exportReport = useCallback((format: 'pdf' | 'xlsx' | 'csv') => {
    return exportReportMutation.mutate(format);
  }, [exportReportMutation]);

  // Auto-generate report on mount
  React.useEffect(() => {
    if (user?.id) {
      generateReport();
    }
  }, [user?.id]);

  return {
    reportConfig,
    reportData,
    updateConfig,
    generateReport,
    exportReport,
    isGenerating: generateReportMutation.isPending,
    isExporting: exportReportMutation.isPending,
    error: generateReportMutation.error || exportReportMutation.error,
  };
};

// Helper function to process raw invoice data into report format
function processInvoiceData(invoices: any[]): ReportData {
  const totalInvoices = invoices.length;
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const totalOutstanding = totalBilled - totalCollected;
  
  const paidInvoices = invoices.filter(inv => inv.payment_status === 'paid');
  const overdueInvoices = invoices.filter(inv => {
    const dueDate = new Date(inv.due_date);
    return dueDate < new Date() && inv.payment_status !== 'paid';
  });
  
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total_amount - (inv.paid_amount || 0)), 0);
  const averageInvoiceValue = totalInvoices > 0 ? totalBilled / totalInvoices : 0;
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  // Generate aging analysis
  const now = new Date();
  const aging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    over90: 0,
  };

  overdueInvoices.forEach(invoice => {
    const dueDate = new Date(invoice.due_date);
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = invoice.total_amount - (invoice.paid_amount || 0);

    if (daysOverdue <= 30) aging.current += amount;
    else if (daysOverdue <= 60) aging.days30 += amount;
    else if (daysOverdue <= 90) aging.days60 += amount;
    else if (daysOverdue <= 120) aging.days90 += amount;
    else aging.over90 += amount;
  });

  // Generate monthly trends
  const monthlyData = new Map();
  invoices.forEach(invoice => {
    const month = format(new Date(invoice.issue_date), 'MMM yyyy');
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { amount: 0, count: 0, paid: 0, unpaid: 0 });
    }
    const data = monthlyData.get(month);
    data.amount += invoice.total_amount || 0;
    data.count += 1;
    if (invoice.payment_status === 'paid') {
      data.paid += invoice.total_amount || 0;
    } else {
      data.unpaid += invoice.total_amount || 0;
    }
  });

  const monthlyRevenue = Array.from(monthlyData.entries()).map(([month, data]) => ({
    month,
    amount: data.amount,
    count: data.count,
  }));

  const paymentTrends = Array.from(monthlyData.entries()).map(([month, data]) => ({
    month,
    paid: data.paid,
    unpaid: data.unpaid,
  }));

  // Generate top clients
  const clientData = new Map();
  invoices.forEach(invoice => {
    if (!invoice.clients) return;
    
    const clientId = invoice.clients.id;
    const clientName = invoice.clients.name || 
      `${invoice.clients.first_name || ''} ${invoice.clients.last_name || ''}`.trim() ||
      invoice.clients.company || 'Unknown Client';

    if (!clientData.has(clientId)) {
      clientData.set(clientId, {
        clientId,
        clientName,
        totalBilled: 0,
        totalPaid: 0,
        invoiceCount: 0,
        totalPaymentDays: 0,
        paymentCount: 0,
      });
    }

    const data = clientData.get(clientId);
    data.totalBilled += invoice.total_amount || 0;
    data.totalPaid += invoice.paid_amount || 0;
    data.invoiceCount += 1;

    // Calculate payment days if invoice is paid
    if (invoice.payment_status === 'paid' && invoice.payments?.length > 0) {
      const issueDate = new Date(invoice.issue_date);
      const paymentDate = new Date(invoice.payments[0].payment_date);
      const paymentDays = Math.floor((paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      data.totalPaymentDays += paymentDays;
      data.paymentCount += 1;
    }
  });

  const topClients = Array.from(clientData.values())
    .map(client => ({
      ...client,
      averagePaymentDays: client.paymentCount > 0 ? client.totalPaymentDays / client.paymentCount : 0,
    }))
    .sort((a, b) => b.totalBilled - a.totalBilled)
    .slice(0, 10);

  // Generate top items
  const itemData = new Map();
  invoices.forEach(invoice => {
    invoice.invoice_items?.forEach((item: any) => {
      if (!itemData.has(item.product_name)) {
        itemData.set(item.product_name, {
          itemName: item.product_name,
          quantity: 0,
          totalRevenue: 0,
          totalPrice: 0,
          count: 0,
        });
      }
      const data = itemData.get(item.product_name);
      data.quantity += item.quantity || 0;
      data.totalRevenue += item.amount || 0;
      data.totalPrice += item.rate || 0;
      data.count += 1;
    });
  });

  const topItems = Array.from(itemData.values())
    .map(item => ({
      itemName: item.itemName,
      quantity: item.quantity,
      totalRevenue: item.totalRevenue,
      averagePrice: item.count > 0 ? item.totalPrice / item.count : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  // Generate narrative insights
  const narrative = generateNarrative({
    totalInvoices,
    totalBilled,
    collectionRate,
    averageInvoiceValue,
    totalOverdue,
    topClients,
    monthlyRevenue,
  });

  return {
    summary: {
      totalInvoices,
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      averageInvoiceValue,
      collectionRate,
    },
    trends: {
      monthlyRevenue,
      paymentTrends,
      clientGrowth: [], // Would need historical client data
    },
    aging,
    topClients,
    topItems,
    narrative,
  };
}

function generateNarrative(data: any): ReportData['narrative'] {
  const insights = [];
  const recommendations = [];
  const risks = [];
  const opportunities = [];

  // Collection rate insights
  if (data.collectionRate > 95) {
    insights.push('Excellent collection rate indicates strong cash flow management');
  } else if (data.collectionRate > 85) {
    insights.push('Good collection rate with room for improvement');
    recommendations.push('Consider implementing automated payment reminders');
  } else {
    insights.push('Collection rate below industry standards requires attention');
    recommendations.push('Review credit policies and collection procedures');
    risks.push('Poor collection rate may impact cash flow');
  }

  // Overdue analysis
  if (data.totalOverdue > data.totalBilled * 0.15) {
    risks.push('High overdue amount may indicate collection issues');
    recommendations.push('Implement stricter payment terms and follow-up procedures');
  }

  // Client concentration
  if (data.topClients.length > 0) {
    const topClientRevenue = data.topClients[0].totalBilled;
    const concentrationRatio = topClientRevenue / data.totalBilled;
    
    if (concentrationRatio > 0.3) {
      risks.push('High client concentration risk with top client accounting for over 30% of revenue');
      recommendations.push('Diversify client base to reduce dependency on single clients');
    }
  }

  // Growth opportunities
  if (data.averageInvoiceValue < 1000) {
    opportunities.push('Potential to increase average invoice value through upselling');
  }

  opportunities.push('Consider offering early payment discounts to improve cash flow');

  return {
    keyInsights: insights,
    recommendations,
    risks,
    opportunities,
  };
}