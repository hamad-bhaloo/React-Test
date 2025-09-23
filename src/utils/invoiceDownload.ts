import { supabase } from '@/integrations/supabase/client';
import { getTemplateConfig } from '@/templates/invoiceTemplates';
import { getSelectedTemplate } from './getSelectedTemplate';
import { generateTemplateCSS } from '@/templates/templateStyles';
import { generateInvoiceHTML } from '@/templates/htmlGenerator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Handlebars from 'handlebars';
import { format } from 'date-fns';
import { defaultTemplate } from '@/templates/default.template';
import { currencies } from '@/constants/currencies';

export const getCompanyData = async (): Promise<any> => {
  try {
    console.log('Fetching company data from company table...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching company data:', error);
      return null;
    }
    
    console.log('Company data from database:', company);
    return company;
  } catch (error) {
    console.error('Exception fetching company data:', error);
    return null;
  }
};

export const getCompanyLogo = async (): Promise<string | null> => {
  const company = await getCompanyData();
  return company?.logo_url || null;
};

const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
};

export const downloadInvoicePDF1 = async (
  invoice: any,
  client: any,
  items: any[],
  subscriptionTier: string
) => {
  try {
    console.log('data------->', JSON.stringify({
      invoice,
      client,
      items,
      subscriptionTier,
    }))
    console.log('Starting PDF generation for invoice:', invoice.invoice_number);
    
    // Get company data
    const companyData = await getCompanyData();
    console.log('Company data for PDF:', companyData);
    
    // Create PDF with clean design
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Clean color scheme
    const primaryColor = '#1f2937';
    const secondaryColor = '#6b7280';
    const accentColor = '#3b82f6';
    
    let yPosition = 30;
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;
    
    // Header section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(primaryColor);
    pdf.text('INVOICE', leftMargin, yPosition);
    
    // Company logo (top right)
    if (companyData?.logo_url) {
      try {
        const logoBase64 = await loadImageAsBase64(companyData.logo_url);
        if (logoBase64) {
          pdf.addImage(logoBase64, 'PNG', rightMargin - 40, yPosition - 15, 35, 20);
        }
      } catch (error) {
        console.error('Error adding logo:', error);
      }
    }
    
    yPosition += 20;
    
    // Invoice details (right aligned)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(secondaryColor);
    
    const invoiceDetailsX = rightMargin - 60;
    pdf.text('Invoice Number:', invoiceDetailsX, yPosition);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor);
    pdf.text(invoice.invoice_number, invoiceDetailsX, yPosition + 8);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(secondaryColor);
    pdf.text('Date:', invoiceDetailsX, yPosition + 20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor);
    pdf.text(new Date(invoice.issue_date).toLocaleDateString(), invoiceDetailsX, yPosition + 28);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(secondaryColor);
    pdf.text('Due Date:', invoiceDetailsX, yPosition + 40);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor);
    pdf.text(new Date(invoice.due_date).toLocaleDateString(), invoiceDetailsX, yPosition + 48);
    
    yPosition += 70;
    
    // Bill From section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(primaryColor);
    pdf.text('FROM:', leftMargin, yPosition);
    
    yPosition += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(companyData?.name || 'Your Company', leftMargin, yPosition);
    
    yPosition += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(secondaryColor);
    
    if (companyData?.address) {
      pdf.text(companyData.address, leftMargin, yPosition);
      yPosition += 8;
    }
    
    if (companyData?.city || companyData?.state || companyData?.zip_code) {
      const addressLine2 = [companyData?.city, companyData?.state, companyData?.zip_code]
        .filter(Boolean).join(', ');
      pdf.text(addressLine2, leftMargin, yPosition);
      yPosition += 8;
    }
    
    if (companyData?.country) {
      pdf.text(companyData.country, leftMargin, yPosition);
      yPosition += 8;
    }
    
    if (companyData?.email) {
      pdf.text(companyData.email, leftMargin, yPosition);
      yPosition += 8;
    }
    
    if (companyData?.phone) {
      pdf.text(companyData.phone, leftMargin, yPosition);
      yPosition += 8;
    }
    
    // Bill To section (right side)
    const billToX = pageWidth / 2 + 10;
    const billToY = yPosition - (companyData?.phone ? 60 : 52);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(primaryColor);
    pdf.text('TO:', billToX, billToY);
    
    let currentBillToY = billToY + 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    
    const clientName = client?.name || 
      `${client?.first_name || ''} ${client?.last_name || ''}`.trim() || 
      client?.company || 'Client';
    pdf.text(clientName, billToX, currentBillToY);
    
    currentBillToY += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(secondaryColor);
    
    if (client?.company && client?.name !== client?.company) {
      pdf.text(client.company, billToX, currentBillToY);
      currentBillToY += 8;
    }
    
    if (client?.address) {
      pdf.text(client.address, billToX, currentBillToY);
      currentBillToY += 8;
    }
    
    if (client?.city || client?.state || client?.zip_code) {
      const clientAddressLine2 = [client?.city, client?.state, client?.zip_code]
        .filter(Boolean).join(', ');
      pdf.text(clientAddressLine2, billToX, currentBillToY);
      currentBillToY += 8;
    }
    
    if (client?.country) {
      pdf.text(client.country, billToX, currentBillToY);
      currentBillToY += 8;
    }
    
    if (client?.email) {
      pdf.text(client.email, billToX, currentBillToY);
      currentBillToY += 8;
    }
    
    if (client?.phone) {
      pdf.text(client.phone, billToX, currentBillToY);
      currentBillToY += 8;
    }
    
    yPosition = Math.max(yPosition, currentBillToY) + 20;
    
    // Items table
    const tableStartY = yPosition;
    const tableHeaders = ['Description', 'Qty', 'Rate', 'Amount'];
    const columnWidths = [85, 20, 30, 30];
    const tableX = leftMargin;
    
    // Table header
    pdf.setFillColor(248, 249, 250);
    pdf.rect(tableX, tableStartY, pageWidth - 40, 12, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(primaryColor);
    
    let currentX = tableX + 5;
    tableHeaders.forEach((header, index) => {
      if (index === 0) {
        pdf.text(header, currentX, tableStartY + 8);
      } else {
        // Right align numeric headers
        const headerWidth = pdf.getTextWidth(header);
        pdf.text(header, currentX + columnWidths[index] - headerWidth - 5, tableStartY + 8);
      }
      currentX += columnWidths[index];
    });
    
    yPosition = tableStartY + 20;
    
    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(primaryColor);
    
    items.forEach((item: any, index: number) => {
      const rowHeight = 15;
      
      // Alternating row background
      if (index % 2 === 1) {
        pdf.setFillColor(252, 252, 252);
        pdf.rect(tableX, yPosition - 4, pageWidth - 40, rowHeight, 'F');
      }
      
      currentX = tableX + 5;
      
      // Description
      const description = item.product_name + (item.description ? ` - ${item.description}` : '');
      const descLines = pdf.splitTextToSize(description, columnWidths[0] - 10);
      pdf.text(descLines[0], currentX, yPosition + 4);
      currentX += columnWidths[0];
      
      // Quantity (right aligned) with unit
      const qtyText = `${item.quantity} ${item.unit || 'pcs'}`;
      const qtyWidth = pdf.getTextWidth(qtyText);
      pdf.text(qtyText, currentX + columnWidths[1] - qtyWidth - 5, yPosition + 4);
      currentX += columnWidths[1];
      
      // Rate (right aligned)
      const rateText = `${invoice.currency || 'USD'} ${Number(item.rate).toFixed(2)}`;
      const rateWidth = pdf.getTextWidth(rateText);
      pdf.text(rateText, currentX + columnWidths[2] - rateWidth - 5, yPosition + 4);
      currentX += columnWidths[2];
      
      // Amount (right aligned)
      const amountText = `${invoice.currency || 'USD'} ${Number(item.amount).toFixed(2)}`;
      const amountWidth = pdf.getTextWidth(amountText);
      pdf.text(amountText, currentX + columnWidths[3] - amountWidth - 5, yPosition + 4);
      
      yPosition += rowHeight;
    });
    
    yPosition += 10;
    
    // Totals section
    const totalsX = pageWidth - 80;
    
    // Subtotal
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(secondaryColor);
    pdf.text('Subtotal:', totalsX - 30, yPosition);
    const subtotalText = `${invoice.currency || 'USD'} ${Number(invoice.subtotal || 0).toFixed(2)}`;
    const subtotalWidth = pdf.getTextWidth(subtotalText);
    pdf.text(subtotalText, totalsX + 30 - subtotalWidth, yPosition);
    yPosition += 12;
    
    // Discount
    if (invoice.discount_amount > 0) {
      pdf.text(`Discount (${invoice.discount_percentage || 0}%):`, totalsX - 30, yPosition);
      const discountText = `-${invoice.currency || 'USD'} ${Number(invoice.discount_amount).toFixed(2)}`;
      const discountWidth = pdf.getTextWidth(discountText);
      pdf.text(discountText, totalsX + 30 - discountWidth, yPosition);
      yPosition += 12;
    }
    
    // Tax
    if (invoice.tax_amount > 0) {
      pdf.text(`Tax (${invoice.tax_percentage || 0}%):`, totalsX - 30, yPosition);
      const taxText = `${invoice.currency || 'USD'} ${Number(invoice.tax_amount).toFixed(2)}`;
      const taxWidth = pdf.getTextWidth(taxText);
      pdf.text(taxText, totalsX + 30 - taxWidth, yPosition);
      yPosition += 12;
    }
    
    // Shipping
    if (invoice.shipping_charge > 0) {
      pdf.text('Shipping:', totalsX - 30, yPosition);
      const shippingText = `${invoice.currency || 'USD'} ${Number(invoice.shipping_charge).toFixed(2)}`;
      const shippingWidth = pdf.getTextWidth(shippingText);
      pdf.text(shippingText, totalsX + 30 - shippingWidth, yPosition);
      yPosition += 12;
    }
    
    // Total line
    pdf.setDrawColor(primaryColor);
    pdf.line(totalsX - 30, yPosition + 2, totalsX + 30, yPosition + 2);
    yPosition += 8;
    
    // Total
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(primaryColor);
    pdf.text('TOTAL:', totalsX - 30, yPosition);
    const totalText = `${invoice.currency || 'USD'} ${Number(invoice.total_amount || 0).toFixed(2)}`;
    const totalWidth = pdf.getTextWidth(totalText);
    pdf.text(totalText, totalsX + 30 - totalWidth, yPosition);
    
    // Payment information for partial payments
    const paidAmount = Number(invoice.paid_amount || 0);
    const totalAmount = Number(invoice.total_amount || 0);
    const balance = totalAmount - paidAmount;
    
    if (paidAmount > 0) {
      yPosition += 15;
      
      // Paid amount
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(34, 197, 94); // green-500
      pdf.text('Paid Amount:', totalsX - 30, yPosition);
      const paidText = `${invoice.currency || 'USD'} ${paidAmount.toFixed(2)}`;
      const paidWidth = pdf.getTextWidth(paidText);
      pdf.text(paidText, totalsX + 30 - paidWidth, yPosition);
      yPosition += 10;
      
      // Balance due
      if (balance > 0) {
        pdf.setTextColor(239, 68, 68); // red-500
        pdf.setFont('helvetica', 'bold');
        pdf.text('Balance Due:', totalsX - 30, yPosition);
        const balanceText = `${invoice.currency || 'USD'} ${balance.toFixed(2)}`;
        const balanceWidth = pdf.getTextWidth(balanceText);
        pdf.text(balanceText, totalsX + 30 - balanceWidth, yPosition);
      }
    }
    
    yPosition += 20;
    
    // Notes section
    if (invoice.notes || invoice.terms) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(primaryColor);
      pdf.text('Terms & Conditions:', leftMargin, yPosition);
      yPosition += 12;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(secondaryColor);
      const notesText = invoice.notes || invoice.terms || '';
      const noteLines = pdf.splitTextToSize(notesText, pageWidth - 40);
      pdf.text(noteLines, leftMargin, yPosition);
      yPosition += noteLines.length * 6;
    }
    
    // Footer
    const footerY = pageHeight - 30;
    
    // Footer line
    pdf.setDrawColor(230, 230, 230);
    pdf.line(leftMargin, footerY - 10, rightMargin, footerY - 10);
    
    // X Invoice logo (for free/basic plans)
    const showXInvoiceLogo = ['Free', 'Basic', 'Premium'].includes(subscriptionTier);
    if (showXInvoiceLogo) {
      try {
        const xInvoiceLogoUrl = 'https://dsvtpfgkguhpkxcdquce.supabase.co/storage/v1/object/public/company-assets/Black%20and%20orange%20Horizontal@3x.png';
        const logoBase64 = await loadImageAsBase64(xInvoiceLogoUrl);
        if (logoBase64) {
          pdf.addImage(logoBase64, 'PNG', leftMargin, footerY - 5, 30, 12);
        }
      } catch (error) {
        console.error('Error adding X Invoice logo:', error);
      }
    }
    
    // Generated date
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(secondaryColor);
    const generatedText = `Generated on ${new Date().toLocaleDateString()}`;
    const generatedWidth = pdf.getTextWidth(generatedText);
    pdf.text(generatedText, rightMargin - generatedWidth, footerY + 5);
    
    // Page numbers (if multiple pages)
    if (pdf.getNumberOfPages() > 1) {
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(secondaryColor);
        const pageText = `Page ${i} of ${pageCount}`;
        const pageTextWidth = pdf.getTextWidth(pageText);
        pdf.text(pageText, (pageWidth - pageTextWidth) / 2, pageHeight - 10);
      }
    }
    
    // Save PDF
    pdf.save(`invoice-${invoice.invoice_number}.pdf`);
    
    console.log('Invoice PDF generated successfully');
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

export const downloadInvoicePDF = async (
  invoice: any,
  client: any,
  items: any[],
  company: any,
  subscriptionTier: string
) => {
  try {
    console.log('Starting PDF generation for invoice:', invoice);

    // Get selected template configuration
    const selectedTemplate = await getSelectedTemplate();
    console.log('Using selected template:', selectedTemplate);

    // Build structured data for template
    const invoiceLogo = company?.logo_url;
    const invoiceFooterLogo = 'https://res.cloudinary.com/dfizbmrep/image/upload/v1747158828/X-Invoice-Images/dbzey29plcu6rhe3acys.png';

    const currencySymbol = currencies.find(item => item.code === (invoice.currency || 'USD'))

    const createdBy = {
      fullName: company?.name || 'Your Company Name',
      address: [
        company?.address,
        [company?.city, company?.state, company?.zip_code].filter(Boolean).join(', '),
        company?.country
      ].filter(Boolean).join(', '),
      mobileNumber: company?.phone || '',
      taxId: company?.tax_id || '',
      email: company?.email || '',
    };

    const address = [
      client?.address || '',
      [client?.city, client?.state, client?.zip_code].filter(Boolean).join(', '),
      client?.country || '',
    ].filter(Boolean).join(', ');

    const paymentStatus =
      invoice.payment_status === 'paid'
        ? 'Paid'
        : invoice.payment_status === 'unpaid'
        ? 'Unpaid'
        : 'Draft';

    const paidAmount = Number(invoice.paid_amount || 0);
    const totalAmount = Number(invoice.total_amount || 0);
    const balance = totalAmount - paidAmount;

    // Generate QR code for the invoice
    let qrCodeDataURL = '';
    try {
      const invoiceUrl = `${window.location.origin}/invoice/${invoice.id}`;
      qrCodeDataURL = await new Promise((resolve, reject) => {
        import('qrcode').then(QRCodeGenerator => {
          QRCodeGenerator.toDataURL(invoiceUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          }).then(resolve).catch(reject);
        }).catch(reject);
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    const invoiceData = {
      invoice: {
        ...invoice,
        invoiceNumber: invoice.invoice_number,
        formatDate: invoice.issue_date
          ? format(new Date(invoice.issue_date), 'MMM dd, yyyy')
          : '',
        formatInvoiceDate: invoice.due_date
          ? format(new Date(invoice.due_date), 'MMM dd, yyyy')
          : '',
        purchaseOrderNumber: invoice.po_number || '',
        paymentStatus,
        currency: currencySymbol.symbol,
        subtotal: Number(invoice.subtotal || 0).toFixed(2),
        total: Number(invoice.total_amount || 0).toFixed(2),
        shippingCharge:
          invoice.shipping_charge > 0
            ? `${currencySymbol.symbol}${Number(invoice.shipping_charge).toFixed(2)}`
            : undefined,
        discount:
          invoice.discount_amount > 0
            ? `${currencySymbol.symbol}${Number(invoice.discount_amount).toFixed(2)}`
            : undefined,
        tax:
          invoice.tax_amount > 0
            ? `${currencySymbol.symbol}${Number(invoice.tax_amount).toFixed(2)}`
            : undefined,
        balance: balance.toFixed(2),
        paidAmount: paidAmount > 0 ? paidAmount.toFixed(2) : undefined,
      },
      client: {
        name: client?.name ||
          `${client?.first_name || ''} ${client?.last_name || ''}`.trim() ||
          'Client',
        company: client?.company || '',
        address,
        email: client?.email || '',
        phone: client?.phone || '',
        taxNumber: client?.tax_number || '',
      },
      company: createdBy,
      items,
      logoUrl: invoiceLogo,
      companyLogoUrl: invoiceLogo,
      qrCode: qrCodeDataURL,
      subscriptionTier
    };

    // Generate HTML using the selected template
    const filledHtml = generateInvoiceHTML(invoiceData, selectedTemplate);

    // Create hidden iframe for accurate CSS rendering
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.width = '794'; // A4 width in pixels at 96 DPI
    iframe.height = '1123'; // A4 height in pixels at 96 DPI
    iframe.srcdoc = filledHtml;
    document.body.appendChild(iframe);

    // Wait for iframe to fully load
    // iframe.onload = async () => {
    //   const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
    //   if (!iframeDocument) {
    //     console.error('Iframe document could not be accessed.');
    //     document.body.removeChild(iframe);
    //     return;
    //   }

    //   const element = iframeDocument.body;

    //   // Generate high-quality canvas snapshot
    //   const canvas = await html2canvas(element, {
    //     scale: 2,
    //     useCORS: true,
    //   });

    //   const imgData = canvas.toDataURL('image/png');
    //   const pdf = new jsPDF('p', 'mm', 'a4');
    //   const pdfWidth = pdf.internal.pageSize.getWidth();
    //   const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    //   pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    //   pdf.save(`invoice-${invoice.invoice_number}.pdf`);

    //   document.body.removeChild(iframe);
    //   console.log('✅ Invoice PDF generated and downloaded successfully.');
    // };

    const result = await new Promise<boolean>((resolve) => {
      iframe.onload = async () => {
        try {
          const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDocument) {
            console.error('❌ Iframe document could not be accessed.');
            document.body.removeChild(iframe);
            resolve(false);
            return;
          }

          const element = iframeDocument.body;

          // Generate high-quality canvas snapshot
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`invoice-${invoice.invoice_number}.pdf`);

          document.body.removeChild(iframe);
          console.log('✅ Invoice PDF generated and downloaded successfully.');
          resolve(true);
        } catch (error) {
          console.error('❌ Error generating PDF inside iframe:', error);
          document.body.removeChild(iframe);
          resolve(false);
        }
      }
    });

    return result;
  
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
  }
};

// Keep the HTML download function for backward compatibility
export const downloadInvoiceHTML = async (
  invoice: any,
  client: any,
  items: any[],
  comapny: any,
  subscriptionTier: string
) => {
  // Redirect to PDF download
  return await downloadInvoicePDF(invoice, client, items, comapny, subscriptionTier);
};
