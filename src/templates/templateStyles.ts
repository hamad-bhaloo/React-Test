
import { TemplateConfig } from './invoiceTemplates';

export const generateTemplateCSS = (template: TemplateConfig): string => {
  // Ensure good contrast for readability
  const isLightBg = template.colors.background ? 
    template.colors.background.includes('#f') || template.colors.background.includes('fff') : true;
  
  // Premium compact template (ID 19) with perfect typography and spacing
  if (template.id === 19) {
    return `
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
        margin: 20px; 
        color: ${template.colors.primary};
        background: ${template.colors.background || '#ffffff'};
        line-height: 1.5;
        font-size: 14px;
      }
      .header-content { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 24px; 
        min-height: 60px;
        width: 100%;
        padding: 16px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      .header-left {
        flex: 1;
        text-align: left;
      }
      .header-right {
        flex: 0 0 auto;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }
      .company-logo { 
        max-height: 50px; 
        max-width: 120px; 
        object-fit: contain; 
        display: block;
      }
      .x-invoice-logo { 
        max-height: 40px; 
        max-width: 100px; 
        object-fit: contain; 
        display: block;
        opacity: 0.7;
      }
      .logo-placeholder {
        width: 100px;
        height: 40px;
        display: inline-block;
      }
      .header { 
        margin-bottom: 24px; 
      }
      .invoice-title { 
        color: ${template.colors.primary}; 
        font-size: 1.75rem; 
        font-weight: 600;
        margin: 0; 
        letter-spacing: -0.025em;
        line-height: 1.2;
      }
      .invoice-number { 
        color: ${template.colors.secondary}; 
        font-size: 0.95rem; 
        font-weight: 500;
        margin-top: 4px;
      }
      .invoice-details { 
        margin-bottom: 24px; 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 24px;
        page-break-inside: avoid;
      }
      .invoice-details h4 {
        font-size: 0.875rem;
        font-weight: 600;
        color: ${template.colors.primary};
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .invoice-details p {
        margin: 2px 0;
        line-height: 1.4;
        word-wrap: break-word;
        font-size: 0.875rem;
        color: ${template.colors.secondary};
      }
      .table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 16px 0; 
        font-size: 0.875rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
      }
      .table th, .table td { 
        padding: 12px 16px; 
        text-align: left; 
        vertical-align: top;
        border-bottom: 1px solid #f1f5f9;
      }
      .table th { 
        background: ${template.gradient}; 
        color: white;
        font-weight: 600; 
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
        border: none;
      }
      .table td {
        border-left: none;
        border-right: none;
      }
      .table tr:last-child td {
        border-bottom: none;
      }
      .table td:last-child {
        text-align: right;
        font-weight: 500;
      }
      .totals { 
        text-align: right; 
        margin-top: 24px; 
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 4px solid ${template.colors.accent};
      }
      .total-row { 
        display: flex; 
        justify-content: space-between; 
        margin: 6px 0; 
        font-size: 0.875rem;
      }
      .total-row:last-child {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
      }
      .total-final { 
        font-weight: 700; 
        font-size: 1.1rem; 
        color: ${template.colors.primary};
      }
      .footer { 
        margin-top: 32px; 
        padding-top: 16px; 
        border-top: 1px solid #e2e8f0; 
        page-break-inside: avoid;
        position: relative;
        min-height: 60px;
        font-size: 0.8rem;
        color: ${template.colors.secondary};
      }
      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        flex-wrap: nowrap;
      }
      .footer-left {
        flex: 1;
        max-width: 70%;
        overflow: hidden;
      }
      .footer-left p {
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .footer-right {
        flex: 0 0 auto;
        max-width: 30%;
      }
      @media print {
        body { margin: 0; font-size: 12px; }
        .header-content { padding: 8px 0; margin-bottom: 16px; }
        .invoice-details { gap: 16px; margin-bottom: 16px; }
        .table th, .table td { padding: 8px 12px; }
        .totals { margin-top: 16px; padding: 12px; }
        .footer { margin-top: 20px; }
      }
    `;
  }
  
  const baseCSS = `
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      margin: 40px; 
      color: ${template.colors.primary};
      background: ${template.colors.background || '#ffffff'};
      line-height: 1.6;
    }
    .header-content { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-bottom: 30px; 
      min-height: 100px;
      width: 100%;
      padding: 20px 0;
    }
    .header-left {
      flex: 1;
      text-align: ${template.layout};
    }
    .header-right {
      flex: 0 0 auto;
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
    }
    .company-logo { 
      max-height: 80px; 
      max-width: 200px; 
      object-fit: contain; 
      display: block;
    }
    .x-invoice-logo { 
      max-height: 60px; 
      max-width: 150px; 
      object-fit: contain; 
      display: block;
      opacity: 0.8;
    }
    .logo-placeholder {
      width: 150px;
      height: 60px;
      display: inline-block;
    }
    .header { 
      margin-bottom: 40px; 
      ${template.id === 1 ? 'border-bottom: 2px solid ' + template.colors.accent + '; padding-bottom: 20px;' : ''}
      ${template.id === 2 ? 'border-left: 5px solid ' + template.colors.accent + '; padding-left: 20px;' : ''}
      ${template.id === 3 ? 'background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px;' : ''}
    }
    .invoice-title { 
      color: ${template.colors.primary}; 
      font-size: ${template.id === 3 ? '2.8em' : template.id === 1 ? '2.5em' : '2.2em'}; 
      margin: 0; 
      ${template.id === 3 ? 'text-shadow: 2px 2px 4px rgba(0,0,0,0.3);' : ''}
    }
    .invoice-number { 
      color: ${template.colors.secondary}; 
      font-size: ${template.id === 3 ? '1.3em' : template.id === 1 ? '1.2em' : '1.1em'}; 
    }
    .invoice-details { 
      margin-bottom: 30px; 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 40px;
      page-break-inside: avoid;
    }
    .invoice-details p {
      margin: 4px 0;
      line-height: 1.4;
      word-wrap: break-word;
    }
    .table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0; 
    }
    .table th, .table td { 
      border: 1px solid #e2e8f0; 
      padding: 15px 12px; 
      text-align: left; 
      vertical-align: top;
    }
    .table th { 
      background-color: ${template.colors.accent}; 
      color: white;
      font-weight: 600; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 0.9em;
    }
    .totals { 
      text-align: right; 
      margin-top: 20px; 
    }
    .total-row { 
      display: flex; 
      justify-content: space-between; 
      margin: 5px 0; 
    }
    .total-final { 
      font-weight: bold; 
      font-size: 1.2em; 
      border-top: 2px solid ${template.colors.accent}; 
      padding-top: 10px; 
    }
    .footer { 
      margin-top: 60px; 
      padding-top: 20px; 
      border-top: 1px solid ${template.id === 3 ? 'rgba(255,255,255,0.2)' : '#ddd'}; 
      page-break-inside: avoid;
      position: relative;
      min-height: 80px;
    }
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      flex-wrap: nowrap;
    }
    .footer-left {
      flex: 1;
      max-width: 70%;
      overflow: hidden;
    }
    .footer-left p {
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .footer-right {
      flex: 0 0 auto;
      max-width: 30%;
    }
  `;
  
  return baseCSS;
};
