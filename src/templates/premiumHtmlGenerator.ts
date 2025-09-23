import { TemplateConfig } from './invoiceTemplates';

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

export const generatePremiumInvoiceHTML = (
  data: InvoiceData,
  template: TemplateConfig
): string => {
  const { invoice, client, items, companyLogoUrl, subscriptionTier } = data;
  
  // Premium layout generators
  switch (template.layout) {
    case 'executive':
      return generateExecutiveLayout(data, template);
    case 'sidebar':
      return generateSidebarLayout(data, template);
    case 'split':
      return generateSplitLayout(data, template);
    case 'modern':
      return generateModernLayout(data, template);
    default:
      return generateStandardLayout(data, template);
  }
};

const generateExecutiveLayout = (data: InvoiceData, template: TemplateConfig): string => {
  const { invoice, client, items, companyLogoUrl } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { 
          font-family: 'Georgia', serif; 
          margin: 0; 
          color: ${template.colors.primary};
          background: ${template.gradient || template.colors.background || '#fff'};
          min-height: 100vh;
        }
        .executive-container {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255,255,255,0.95);
          min-height: 100vh;
          box-shadow: 0 0 50px rgba(0,0,0,0.1);
        }
        .banner-header {
          background: linear-gradient(135deg, ${template.colors.accent}, ${template.colors.primary});
          color: white;
          padding: 60px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .banner-header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.1) 2px,
            rgba(255,255,255,0.1) 4px
          );
        }
        .banner-content {
          position: relative;
          z-index: 2;
        }
        .executive-title {
          font-size: 3.5em;
          font-weight: 300;
          letter-spacing: 8px;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .executive-number {
          font-size: 1.5em;
          opacity: 0.9;
          margin-top: 10px;
          letter-spacing: 2px;
        }
        .company-logo-executive {
          position: absolute;
          top: 30px;
          right: 40px;
          max-height: 80px;
          max-width: 200px;
          background: rgba(255,255,255,0.9);
          padding: 10px;
          border-radius: 10px;
        }
        .executive-body {
          padding: 60px 40px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 60px;
          margin-bottom: 50px;
        }
        .client-section {
          background: linear-gradient(135deg, ${template.colors.background || '#f8f9fa'}, transparent);
          padding: 30px;
          border-radius: 15px;
          border-left: 5px solid ${template.colors.accent};
        }
        .items-table-executive {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 40px 0;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .items-table-executive th {
          background: linear-gradient(135deg, ${template.colors.accent}, ${template.colors.primary});
          color: white;
          padding: 20px;
          font-size: 1.1em;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .items-table-executive td {
          padding: 20px;
          border-bottom: 1px solid #eee;
          vertical-align: top;
        }
         .items-table-executive tr:nth-child(even) {
           background: ${template.colors.background || '#f8f9fa'};
         }
        .totals-highlight {
          background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.accent});
          color: white;
          padding: 40px;
          border-radius: 20px;
          margin-top: 40px;
          text-align: center;
        }
        .final-total {
          font-size: 2.5em;
          font-weight: 300;
          margin: 20px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .executive-footer {
          background: ${template.colors.primary};
          color: white;
          padding: 30px 40px;
          text-align: center;
          margin-top: 60px;
        }
      </style>
    </head>
    <body>
      <div class="executive-container">
        <div class="banner-header">
          ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="Company Logo" class="company-logo-executive" />` : ''}
          <div class="banner-content">
            <h1 class="executive-title">INVOICE</h1>
            <div class="executive-number">${invoice.invoice_number}</div>
          </div>
        </div>
        
        <div class="executive-body">
          <div class="details-grid">
            <div class="client-section">
              <h3 style="color: ${template.colors.accent}; font-size: 1.5em; margin-bottom: 20px;">Bill To</h3>
              <p style="font-size: 1.3em; font-weight: 600; margin-bottom: 15px;">${client?.name || client?.company || 'N/A'}</p>
              ${client?.email ? `<p style="margin: 8px 0;">${client.email}</p>` : ''}
              ${client?.phone ? `<p style="margin: 8px 0;">${client.phone}</p>` : ''}
              ${client?.address ? `<p style="margin: 8px 0;">${client.address}</p>` : ''}
            </div>
            <div>
              <div style="text-align: right;">
                <p><strong>Issue Date:</strong><br>${new Date(invoice.issue_date).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong><br>${new Date(invoice.due_date).toLocaleDateString()}</p>
                <p><strong>Status:</strong><br><span style="color: ${template.colors.accent}; font-weight: 600;">${invoice.status?.toUpperCase()}</span></p>
              </div>
            </div>
          </div>
          
          <table class="items-table-executive">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>
                    <strong style="font-size: 1.1em; color: ${template.colors.primary};">${item.product_name}</strong>
                    ${item.description ? `<br><span style="color: ${template.colors.secondary};">${item.description}</span>` : ''}
                  </td>
                  <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
                  <td style="text-align: right;">${invoice.currency} ${Number(item.rate).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 600; color: ${template.colors.accent};">${invoice.currency} ${Number(item.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals-highlight">
            <div style="font-size: 1.2em; opacity: 0.9; margin-bottom: 10px;">Total Amount</div>
            <div class="final-total">${invoice.currency} ${Number(invoice.total_amount || 0).toFixed(2)}</div>
            <div style="opacity: 0.8;">Thank you for your business</div>
          </div>
        </div>
        
        <div class="executive-footer">
          <p>Generated with ${template.name} Template • ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateSidebarLayout = (data: InvoiceData, template: TemplateConfig): string => {
  const { invoice, client, items, companyLogoUrl } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0; 
          color: ${template.colors.primary};
          background: ${template.colors.background || '#fff'};
        }
        .sidebar-container {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 300px;
          background: linear-gradient(180deg, ${template.colors.primary}, ${template.colors.accent});
          color: white;
          padding: 40px 30px;
          position: relative;
        }
        .sidebar::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 2px;
          height: 100%;
          background: ${template.gradient || template.colors.accent};
          box-shadow: 0 0 20px rgba(0,0,0,0.3);
        }
        .main-content {
          flex: 1;
          padding: 40px 50px;
          background: white;
        }
        .sidebar-logo {
          max-width: 100%;
          max-height: 80px;
          margin-bottom: 40px;
          filter: brightness(0) invert(1);
        }
        .sidebar-title {
          font-size: 2.5em;
          font-weight: 300;
          margin: 40px 0 20px 0;
          letter-spacing: 3px;
        }
        .sidebar-number {
          font-size: 1.3em;
          opacity: 0.9;
          margin-bottom: 40px;
        }
        .sidebar-client {
          background: rgba(255,255,255,0.1);
          padding: 25px;
          border-radius: 10px;
          margin-top: 40px;
        }
        .floating-header {
          background: white;
          box-shadow: 0 5px 25px rgba(0,0,0,0.1);
          padding: 30px;
          border-radius: 15px;
          margin-bottom: 40px;
          border-left: 5px solid ${template.colors.accent};
        }
        .minimal-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        .minimal-table th {
          border-bottom: 3px solid ${template.colors.accent};
          padding: 15px 10px;
          text-align: left;
          font-weight: 600;
          color: ${template.colors.primary};
        }
        .minimal-table td {
          padding: 20px 10px;
          border-bottom: 1px solid #eee;
        }
         .minimal-table tr:hover {
           background: ${template.colors.background || '#f8f9fa'};
         }
        .totals-right {
          text-align: right;
          margin-top: 30px;
          padding: 30px;
          background: linear-gradient(135deg, ${template.colors.background || '#f8f9fa'}, white);
          border-radius: 15px;
          border: 2px solid ${template.colors.accent};
        }
      </style>
    </head>
    <body>
      <div class="sidebar-container">
        <div class="sidebar">
          ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="Company Logo" class="sidebar-logo" />` : ''}
          <h1 class="sidebar-title">INVOICE</h1>
          <div class="sidebar-number">${invoice.invoice_number}</div>
          
          <div style="margin-top: 60px;">
            <p><strong>Issue Date</strong><br>${new Date(invoice.issue_date).toLocaleDateString()}</p>
            <p><strong>Due Date</strong><br>${new Date(invoice.due_date).toLocaleDateString()}</p>
            <p><strong>Status</strong><br>${invoice.status?.toUpperCase()}</p>
          </div>
          
          <div class="sidebar-client">
            <h3 style="margin-top: 0; font-size: 1.2em;">Bill To</h3>
            <p style="font-weight: 600; font-size: 1.1em;">${client?.name || client?.company || 'N/A'}</p>
            ${client?.email ? `<p>${client.email}</p>` : ''}
            ${client?.phone ? `<p>${client.phone}</p>` : ''}
            ${client?.address ? `<p>${client.address}</p>` : ''}
          </div>
        </div>
        
        <div class="main-content">
          <div class="floating-header">
            <h2 style="margin: 0; color: ${template.colors.primary};">Service Details</h2>
            <p style="color: ${template.colors.secondary}; margin: 10px 0 0 0;">Professional services rendered</p>
          </div>
          
          <table class="minimal-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>
                    <strong>${item.product_name}</strong>
                    ${item.description ? `<br><small style="color: ${template.colors.secondary};">${item.description}</small>` : ''}
                  </td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${invoice.currency} ${Number(item.rate).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 600;">${invoice.currency} ${Number(item.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals-right">
            <div style="font-size: 1.4em; font-weight: 600; color: ${template.colors.primary};">
              Total: ${invoice.currency} ${Number(invoice.total_amount || 0).toFixed(2)}
            </div>
            <div style="margin-top: 15px; color: ${template.colors.secondary};">
              Payment due by ${new Date(invoice.due_date).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateSplitLayout = (data: InvoiceData, template: TemplateConfig): string => {
  const { invoice, client, items, companyLogoUrl } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; 
          color: ${template.colors.primary};
          background: ${template.gradient || template.colors.background || '#fff'};
        }
        .split-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }
        .left-panel {
          background: linear-gradient(45deg, ${template.colors.primary}, ${template.colors.accent});
          color: white;
          padding: 60px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .right-panel {
          background: white;
          padding: 60px 40px;
        }
        .minimal-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .tech-title {
          font-size: 3em;
          font-weight: 100;
          letter-spacing: 5px;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .tech-number {
          font-size: 1.2em;
          opacity: 0.8;
          margin-top: 15px;
          letter-spacing: 2px;
        }
        .company-info {
          text-align: center;
        }
        .company-logo-split {
          max-height: 100px;
          max-width: 200px;
          margin-bottom: 30px;
          filter: brightness(0) invert(1);
        }
        .client-card {
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .card-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 10px;
        }
         .card-row {
           background: ${template.colors.background || '#f8f9fa'};
           border-radius: 10px;
           overflow: hidden;
         }
        .card-row td {
          padding: 20px;
          border: none;
        }
        .card-row:first-child td {
          border-radius: 10px 10px 0 0;
        }
        .card-row:last-child td {
          border-radius: 0 0 10px 10px;
        }
        .total-section {
          background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.accent});
          color: white;
          padding: 40px;
          border-radius: 20px;
          margin-top: 40px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="split-container">
        <div class="left-panel">
          <div>
            <div class="minimal-header">
              <h1 class="tech-title">INVOICE</h1>
              <div class="tech-number">${invoice.invoice_number}</div>
            </div>
            
            <div class="company-info">
              ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="Company Logo" class="company-logo-split" />` : ''}
              <div style="margin-top: 40px;">
                <p><strong>Issue Date</strong><br>${new Date(invoice.issue_date).toLocaleDateString()}</p>
                <p><strong>Due Date</strong><br>${new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div class="client-card">
            <h3 style="margin-top: 0; text-align: center;">Bill To</h3>
            <div style="text-align: center;">
              <p style="font-size: 1.2em; font-weight: 600;">${client?.name || client?.company || 'N/A'}</p>
              ${client?.email ? `<p>${client.email}</p>` : ''}
              ${client?.phone ? `<p>${client.phone}</p>` : ''}
              ${client?.address ? `<p>${client.address}</p>` : ''}
            </div>
          </div>
        </div>
        
        <div class="right-panel">
          <h2 style="color: ${template.colors.primary}; margin-bottom: 40px; font-weight: 300;">Service Details</h2>
          
          <table class="card-table">
            ${items.map((item: any) => `
              <tr class="card-row">
                <td>
                  <strong style="color: ${template.colors.primary}; font-size: 1.1em;">${item.product_name}</strong>
                  ${item.description ? `<br><span style="color: ${template.colors.secondary};">${item.description}</span>` : ''}
                  <div style="margin-top: 10px; font-size: 0.9em; color: ${template.colors.secondary};">
                    Qty: ${item.quantity} × ${invoice.currency} ${Number(item.rate).toFixed(2)}
                  </div>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <strong style="font-size: 1.2em; color: ${template.colors.accent};">
                    ${invoice.currency} ${Number(item.amount).toFixed(2)}
                  </strong>
                </td>
              </tr>
            `).join('')}
          </table>
          
          <div class="total-section">
            <div style="font-size: 1.1em; opacity: 0.9;">Total Amount</div>
            <div style="font-size: 2.2em; font-weight: 300; margin: 15px 0;">
              ${invoice.currency} ${Number(invoice.total_amount || 0).toFixed(2)}
            </div>
            <div style="opacity: 0.8;">Payment due by ${new Date(invoice.due_date).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateModernLayout = (data: InvoiceData, template: TemplateConfig): string => {
  const { invoice, client, items, companyLogoUrl } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { 
          font-family: 'Helvetica Neue', Arial, sans-serif; 
          margin: 0; 
          color: ${template.colors.primary};
          background: ${template.colors.background || '#fff'};
          line-height: 1.6;
        }
        .modern-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .floating-header {
          background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7));
          backdrop-filter: blur(20px);
          padding: 40px 50px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid ${template.colors.accent};
        }
        .modern-title {
          font-size: 2.8em;
          font-weight: 200;
          color: ${template.colors.primary};
          margin: 0;
          letter-spacing: 3px;
        }
        .modern-number {
          font-size: 1.1em;
          color: ${template.colors.accent};
          margin-top: 5px;
          font-weight: 500;
        }
        .logo-modern {
          max-height: 70px;
          max-width: 180px;
          object-fit: contain;
        }
        .modern-body {
          padding: 50px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 50px;
        }
         .info-card {
           background: linear-gradient(135deg, ${template.colors.background || '#f8f9fa'}, transparent);
           padding: 25px;
           border-radius: 12px;
           border: 1px solid #e2e8f0;
         }
        .info-card h4 {
          color: ${template.colors.accent};
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 15px 0;
          font-weight: 600;
        }
        .modern-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .modern-table th {
          background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.accent});
          color: white;
          padding: 20px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.9em;
        }
        .modern-table td {
          padding: 25px 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        .modern-table tr:last-child td {
          border-bottom: none;
        }
         .modern-table tr:nth-child(even) {
           background: ${template.colors.background || '#f8f9fa'};
         }
        .highlight-total {
          background: linear-gradient(135deg, ${template.colors.accent}, ${template.colors.primary});
          color: white;
          padding: 30px;
          border-radius: 15px;
          margin-top: 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .highlight-total::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.05) 10px,
            rgba(255,255,255,0.05) 20px
          );
        }
        .highlight-content {
          position: relative;
          z-index: 2;
        }
      </style>
    </head>
    <body>
      <div class="modern-container">
        <div class="floating-header">
          <div>
            <h1 class="modern-title">INVOICE</h1>
            <div class="modern-number">${invoice.invoice_number}</div>
          </div>
          ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="Company Logo" class="logo-modern" />` : ''}
        </div>
        
        <div class="modern-body">
          <div class="info-grid">
            <div class="info-card">
              <h4>Bill To</h4>
              <p style="font-weight: 600; font-size: 1.1em; margin: 0 0 10px 0;">${client?.name || client?.company || 'N/A'}</p>
              ${client?.email ? `<p style="margin: 5px 0;">${client.email}</p>` : ''}
              ${client?.phone ? `<p style="margin: 5px 0;">${client.phone}</p>` : ''}
              ${client?.address ? `<p style="margin: 5px 0;">${client.address}</p>` : ''}
            </div>
            <div class="info-card">
              <h4>Invoice Details</h4>
              <p><strong>Issue Date:</strong><br>${new Date(invoice.issue_date).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong><br>${new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
            <div class="info-card">
              <h4>Status</h4>
              <p style="font-size: 1.3em; font-weight: 600; color: ${template.colors.accent};">
                ${invoice.status?.toUpperCase()}
              </p>
              <p style="color: ${template.colors.secondary};">Currency: ${invoice.currency}</p>
            </div>
          </div>
          
          <table class="modern-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>
                    <strong style="font-size: 1.1em; color: ${template.colors.primary};">${item.product_name}</strong>
                    ${item.description ? `<br><span style="color: ${template.colors.secondary}; font-size: 0.9em;">${item.description}</span>` : ''}
                  </td>
                  <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
                  <td style="text-align: right;">${invoice.currency} ${Number(item.rate).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 600; color: ${template.colors.accent};">${invoice.currency} ${Number(item.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="highlight-total">
            <div class="highlight-content">
              <div style="font-size: 1.1em; opacity: 0.9; margin-bottom: 10px;">Total Amount</div>
              <div style="font-size: 2.5em; font-weight: 200; margin: 15px 0;">
                ${invoice.currency} ${Number(invoice.total_amount || 0).toFixed(2)}
              </div>
              <div style="opacity: 0.8;">Thank you for choosing our services</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateStandardLayout = (data: InvoiceData, template: TemplateConfig): string => {
  // Fallback to standard layout for basic templates
  const { invoice, client, items, companyLogoUrl } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          color: ${template.colors.primary};
          background: ${template.gradient || '#fff'};
        }
        /* Standard layout styles here */
      </style>
    </head>
    <body>
      <!-- Standard invoice layout -->
    </body>
    </html>
  `;
};