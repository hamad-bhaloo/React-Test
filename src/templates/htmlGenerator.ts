
import { TemplateConfig } from './invoiceTemplates';
import { generateTemplateCSS } from './templateStyles';
import { generatePremiumInvoiceHTML } from './premiumHtmlGenerator';

interface InvoiceData {
  invoice: any;
  client: any;
  company: any;
  items: any[];
  logoUrl: string | null;
  companyLogoUrl?: string | null;
  qrCode?: string;
  subscriptionTier: string;
}

export const generateInvoiceHTML = (
  data: InvoiceData,
  template: TemplateConfig
): string => {
  
  // Use premium layouts for premium templates with specific layouts
  if (template.category === 'premium' && ['executive', 'sidebar', 'split', 'modern'].includes(template.layout)) {
    return generatePremiumInvoiceHTML(data, template);
  }
  
  // Use standard layout for basic templates
  const { invoice, client, items, companyLogoUrl, subscriptionTier } = data;
  
  // Use the correct X Invoice logo URL
  const xInvoiceLogoUrl = 'https://dsvtpfgkguhpkxcdquce.supabase.co/storage/v1/object/public/company-assets/Black%20and%20orange%20Horizontal@3x.png';
  const showXInvoiceLogo = ['Free', 'Basic', 'Premium'].includes(subscriptionTier);
  
  console.log('Generating HTML with template:', template.name);
  console.log('Logos:', { companyLogoUrl, xInvoiceLogoUrl, showXInvoiceLogo });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        ${generateTemplateCSS(template)}
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="invoice-title">INVOICE</h1>
            <h2 class="invoice-number">${invoice.invoice_number}</h2>
          </div>
          <div class="header-right">
            ${companyLogoUrl ? 
              `<img src="${companyLogoUrl}" alt="Company Logo" class="company-logo" />` : 
              `<div class="logo-placeholder"></div>`
            }
          </div>
        </div>
      </div>
      
      <div class="invoice-details">
        <div>
          <h3>Bill To:</h3>
          <p><strong>${client?.name || `${client?.first_name || ''} ${client?.last_name || ''}` || client?.company || 'N/A'}</strong></p>
          ${client?.email ? `<p>${client.email}</p>` : ''}
          ${client?.phone ? `<p>${client.phone}</p>` : ''}
          ${client?.address ? `<p>${client.address}</p>` : ''}
          ${client?.city ? `<p>${client.city}${client.state ? `, ${client.state}` : ''} ${client.zip_code || ''}</p>` : ''}
        </div>
        <div>
          <p><strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${invoice.status?.toUpperCase()}</p>
          <p><strong>Currency:</strong> ${invoice.currency}</p>
          
        </div>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>
                <strong>${item.product_name}</strong>
                ${item.description ? `<br><small>${item.description}</small>` : ''}
              </td>
              <td>${item.quantity}</td>
              <td>${invoice.currency} ${Number(item.rate).toFixed(2)}</td>
              <td>${invoice.currency} ${Number(item.amount).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${invoice.currency} ${Number(invoice.subtotal || 0).toFixed(2)}</span>
        </div>
        ${invoice.discount_amount > 0 ? `
          <div class="total-row" style="color: red;">
            <span>Discount (${invoice.discount_percentage}%):</span>
            <span>-${invoice.currency} ${Number(invoice.discount_amount || 0).toFixed(2)}</span>
          </div>
        ` : ''}
        ${invoice.tax_amount > 0 ? `
          <div class="total-row">
            <span>Tax (${invoice.tax_percentage}%):</span>
            <span>${invoice.currency} ${Number(invoice.tax_amount || 0).toFixed(2)}</span>
          </div>
        ` : ''}
        ${invoice.shipping_charge > 0 ? `
          <div class="total-row">
            <span>Shipping:</span>
            <span>${invoice.currency} ${Number(invoice.shipping_charge || 0).toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-row total-final">
          <span>Total:</span>
          <span>${invoice.currency} ${Number(invoice.total_amount || 0).toFixed(2)}</span>
        </div>
        ${Number(invoice.paid_amount || 0) > 0 ? `
          <div class="total-row" style="color: #10b981; font-weight: bold;">
            <span>Paid Amount:</span>
            <span>${invoice.currency} ${Number(invoice.paid_amount || 0).toFixed(2)}</span>
          </div>
          <div class="total-row" style="color: #ef4444; font-weight: bold; border-top: 1px solid #e5e7eb; padding-top: 8px;">
            <span>Balance Due:</span>
            <span>${invoice.currency} ${Number((invoice.total_amount || 0) - (invoice.paid_amount || 0)).toFixed(2)}</span>
          </div>
        ` : ''}
      </div>
      
      ${invoice.notes ? `
        <div style="margin-top: 40px;">
          <h3>Notes:</h3>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        <div class="footer-content">
          <div class="footer-left">
            <p style="color: ${template.colors.secondary}; font-size: 0.9em;">
              Generated on ${new Date().toLocaleDateString()}
            </p>
          </div>
          <div class="footer-right">
            ${showXInvoiceLogo ? 
              `<img src="${xInvoiceLogoUrl}" alt="X Invoice" class="x-invoice-logo" />` : 
              `<div class="logo-placeholder"></div>`
            }
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
