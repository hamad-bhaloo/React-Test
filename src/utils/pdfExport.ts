import jsPDF from 'jspdf';
import { ReportData } from '@/hooks/useReportBuilder';
import { format } from 'date-fns';

export interface PDFReportOptions {
  title: string;
  description?: string;
  companyName?: string;
  logoUrl?: string;
  includeCoverPage?: boolean;
  includeCharts?: boolean;
  includeTableOfContents?: boolean;
}

export const generatePDFReport = async (
  reportData: ReportData,
  options: PDFReportOptions
): Promise<void> => {
  try {
    console.log('Starting PDF generation with data:', reportData);
    console.log('PDF options:', options);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 12) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return lines.length * (fontSize * 0.6); // Approximate line height
  };

  // Cover Page
  if (options.includeCoverPage) {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title, pageWidth / 2, 60, { align: 'center' });
    
    if (options.description) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(options.description, pageWidth / 2, 80, { align: 'center' });
    }
    
    if (options.companyName) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(options.companyName, pageWidth / 2, 120, { align: 'center' });
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, 140, { align: 'center' });
    
    doc.addPage();
    currentY = margin;
  }

  // Table of Contents
  if (options.includeTableOfContents) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Table of Contents', margin, currentY);
    currentY += 20;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const tocItems = [
      'Executive Summary',
      'Financial Overview', 
      'Revenue Analysis',
      'Client Performance',
      'Aging Analysis',
      'Recommendations'
    ];
    
    tocItems.forEach((item, index) => {
      doc.text(`${index + 1}. ${item}`, margin + 5, currentY);
      currentY += 8;
    });
    
    doc.addPage();
    currentY = margin;
  }

  // Executive Summary
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, currentY);
  currentY += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const summaryText = `This report provides a comprehensive analysis of your business performance. Key highlights include ${reportData.summary.totalInvoices} invoices totaling $${reportData.summary.totalBilled.toLocaleString()} with a collection rate of ${reportData.summary.collectionRate.toFixed(1)}%.`;
  
  const summaryHeight = addWrappedText(summaryText, margin, currentY, pageWidth - 2 * margin);
  currentY += summaryHeight + 15;

  checkPageBreak(80);

  // Financial Overview Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Overview', margin, currentY);
  currentY += 15;

  // Summary stats in a table-like format
  const stats = [
    ['Total Invoices', reportData.summary.totalInvoices.toString()],
    ['Total Billed', `$${reportData.summary.totalBilled.toLocaleString()}`],
    ['Total Collected', `$${reportData.summary.totalCollected.toLocaleString()}`],
    ['Outstanding', `$${reportData.summary.totalOutstanding.toLocaleString()}`],
    ['Average Invoice', `$${reportData.summary.averageInvoiceValue.toFixed(0)}`],
    ['Collection Rate', `${reportData.summary.collectionRate.toFixed(1)}%`]
  ];

  doc.setFontSize(11);
  stats.forEach(([label, value]) => {
    checkPageBreak(10);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin + 5, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + 120, currentY);
    currentY += 8;
  });

  currentY += 10;
  checkPageBreak(60);

  // Top Clients Section
  if (reportData.topClients.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Clients by Revenue', margin, currentY);
    currentY += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Client Name', margin + 5, currentY);
    doc.text('Total Billed', margin + 80, currentY);
    doc.text('Invoices', margin + 130, currentY);
    doc.text('Avg Payment Days', margin + 160, currentY);
    currentY += 8;

    // Draw header line
    doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2);
    currentY += 3;

    doc.setFont('helvetica', 'normal');
    reportData.topClients.slice(0, 10).forEach((client) => {
      checkPageBreak(10);
      doc.text(client.clientName.substring(0, 25), margin + 5, currentY);
      doc.text(`$${client.totalBilled.toLocaleString()}`, margin + 80, currentY);
      doc.text(client.invoiceCount.toString(), margin + 130, currentY);
      doc.text(client.averagePaymentDays.toFixed(0), margin + 160, currentY);
      currentY += 8;
    });

    currentY += 10;
  }

  checkPageBreak(60);

  // Aging Analysis
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Aging Analysis', margin, currentY);
  currentY += 15;

  const agingData = [
    ['Current (0-30 days)', `$${reportData.aging.current.toLocaleString()}`],
    ['31-60 days', `$${reportData.aging.days30.toLocaleString()}`],
    ['61-90 days', `$${reportData.aging.days60.toLocaleString()}`],
    ['91+ days', `$${reportData.aging.days90.toLocaleString()}`],
    ['Over 90 days', `$${reportData.aging.over90.toLocaleString()}`]
  ];

  doc.setFontSize(11);
  agingData.forEach(([label, amount]) => {
    checkPageBreak(10);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin + 5, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(amount, margin + 120, currentY);
    currentY += 8;
  });

  currentY += 15;
  checkPageBreak(80);

  // Key Insights
  if (reportData.narrative.keyInsights.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Insights', margin, currentY);
    currentY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    reportData.narrative.keyInsights.forEach((insight, index) => {
      checkPageBreak(15);
      const bulletText = `• ${insight}`;
      const textHeight = addWrappedText(bulletText, margin + 5, currentY, pageWidth - 2 * margin - 10);
      currentY += textHeight + 5;
    });

    currentY += 10;
  }

  // Recommendations
  if (reportData.narrative.recommendations.length > 0) {
    checkPageBreak(60);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', margin, currentY);
    currentY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    reportData.narrative.recommendations.forEach((recommendation, index) => {
      checkPageBreak(15);
      const bulletText = `${index + 1}. ${recommendation}`;
      const textHeight = addWrappedText(bulletText, margin + 5, currentY, pageWidth - 2 * margin - 10);
      currentY += textHeight + 5;
    });
  }

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.text(`Generated by Lovable Invoice System - ${format(new Date(), 'yyyy-MM-dd')}`, margin, pageHeight - 10);
  }

    // Save the PDF
    const filename = `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${format(new Date(), 'yyyy_MM_dd')}.pdf`;
    console.log('Saving PDF with filename:', filename);
    
    // Force download
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('PDF download triggered successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateReportCSV = (reportData: ReportData): void => {
  const csvData = [
    // Header row
    ['Metric', 'Value', 'Description'],
    
    // Summary data
    ['Total Invoices', reportData.summary.totalInvoices.toString(), 'Total number of invoices in report period'],
    ['Total Billed', reportData.summary.totalBilled.toFixed(2), 'Total amount billed in report period'],
    ['Total Collected', reportData.summary.totalCollected.toFixed(2), 'Total amount collected in report period'],
    ['Total Outstanding', reportData.summary.totalOutstanding.toFixed(2), 'Total amount still outstanding'],
    ['Average Invoice Value', reportData.summary.averageInvoiceValue.toFixed(2), 'Average value per invoice'],
    ['Collection Rate', `${reportData.summary.collectionRate.toFixed(1)}%`, 'Percentage of billed amount collected'],
    
    // Empty row for separation
    ['', '', ''],
    ['Top Clients', '', ''],
    ['Client Name', 'Total Billed', 'Invoices Count'],
    
    // Top clients data
    ...reportData.topClients.slice(0, 10).map(client => [
      client.clientName,
      client.totalBilled.toFixed(2),
      client.invoiceCount.toString()
    ]),
    
    // Empty row for separation
    ['', '', ''],
    ['Aging Analysis', '', ''],
    ['Age Range', 'Amount', 'Description'],
    ['Current (0-30 days)', reportData.aging.current.toFixed(2), 'Current outstanding amounts'],
    ['31-60 days', reportData.aging.days30.toFixed(2), 'Amounts overdue 31-60 days'],
    ['61-90 days', reportData.aging.days60.toFixed(2), 'Amounts overdue 61-90 days'],
    ['Over 90 days', reportData.aging.over90.toFixed(2), 'Amounts overdue over 90 days']
  ];

  const csvContent = csvData.map(row => 
    row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `financial_report_${format(new Date(), 'yyyy_MM_dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};