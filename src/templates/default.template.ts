export const defaultTemplate = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>X-Invoice PDF</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      letter-spacing: -0.01em;
    }

    body {
      padding: 32px;
      font-size: 13px;
      color: #1f2937;
      min-height: 100vh;
      position: relative;
      line-height: 1.4;
      font-weight: 400;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .logo {
      width: 90px;
      height: auto;
      max-height: 40px;
      object-fit: contain;
    }

    .section {
      display: flex;
      justify-content: space-between;
      margin: 16px 0;
      gap: 24px;
    }

    .section p {
      margin-bottom: 3px;
      font-size: 12px;
      line-height: 1.3;
    }

    .table-wrapper {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0 16px 0;
      font-size: 12px;
    }

    .table-wrapper th,
    .table-wrapper td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
      line-height: 1.3;
    }

    .table-wrapper th {
      background-color: #f8fafc;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      color: #374151;
    }

    .total-box {
      width: 280px;
      float: right;
      margin-top: 20px;
      font-size: 12px;
    }

    .total-box .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      padding: 2px 0;
    }

    .balance-box {
      border: 2px solid #dc2626;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 12px;
      margin-bottom: 16px;
    }

    .balance-box .header {
      background-color: #dc2626;
      color: #fff;
      padding: 8px 12px;
      text-align: center;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .balance-box .body {
      padding: 12px;
      text-align: right;
      font-weight: 700;
      font-size: 16px;
      background-color: #fef2f2;
    }

    .footer {
      width: 100%;
      margin-top: 20px;
      padding: 16px 0 0;
      border-top: 1px solid #d1d5db;
      display: flex;
      justify-content: space-between;
      background: white;
      font-size: 11px;
    }

    .footer img {
      height: 32px;
    }

    .left-align p strong {
      display: inline-block;
      min-width: 100px;
      font-weight: 600;
    }

    .flex-col {
      display: flex;
      flex-direction: column;
    }

    .invoice-status-box {
      margin-top: 12px;
    }

    .status-paid,
    .status-unpaid,
    .status-draft {
      padding: 4px 10px;
      font-weight: 600;
      font-size: 11px;
      border-radius: 3px;
      display: inline-block;
      text-transform: uppercase;
      text-align: center;
      width: 100%;
      letter-spacing: 0.025em;
    }

    .status-paid {
      background-color: #e6ffed;
      color: #2e7d32;
      border: 1px solid #a5d6a7;
    }

    .status-unpaid {
      background-color: #ffe6e6;
      color: #c62828;
      border: 1px solid #ef9a9a;
    }

    .status-draft {
      background-color: #fff8e1;
      color: #f57c00;
      border: 1px solid #f59e0b;
    }
    
    .invoice-title {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      font-weight: 600;
      color: #1f2937;
      letter-spacing: -0.02em;
    }
    
    .section-title {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #374151;
      margin-bottom: 6px;
    }
    
    .client-name, .company-name {
      font-weight: 600;
      font-size: 14px;
      color: #1f2937;
      margin-bottom: 4px;
    }
  </style>
</head>

<body>
  <div class="header-section">
    <div>
      <h1 class="invoice-title">Invoice</h1>
    </div>
    <div>
      <img class="logo" src="{{invoicelogo}}" alt="Logo" />
    </div>
  </div>

  <div class="section">
    <div class="left-align flex-col">
      <p class="section-title">From:</p>
      {{#if createdBy.fullName}}<p class="company-name">{{createdBy.fullName}}</p>{{/if}}
      {{#if createdBy.address}}<p>{{createdBy.address}}</p>{{/if}}
      {{#if createdBy.mobileNumber}}<p>{{createdBy.mobileNumber}}</p>{{/if}}
      {{#if createdBy.taxId}}<p>{{createdBy.taxId}}</p>{{/if}}

      <div style="margin-top: 16px;">
        <p class="section-title">To:</p>
        {{#if client.firstName}}<p class="client-name">{{client.firstName}}</p>{{/if}}
        {{#if client.company}}<p class="client-name">{{client.company.companyName}}</p>{{/if}}
        {{#if address}}<p>{{address}}</p>{{/if}}
        {{#if shippingAddress.taxNumber}}<p>{{shippingAddress.taxNumber}}</p>{{/if}}
      </div>
    </div>

    <div class="left-align">
      <p><strong>Invoice No:</strong> {{invoiceNumber}}</p>
      <p><strong>Date:</strong> {{formatDate}}</p>
      <p><strong>Invoice Due:</strong> {{formatInvoiceDate}}</p>
      {{#if purchaseOrderNumber}}<p><strong>PO Number:</strong> {{purchaseOrderNumber}}</p>{{/if}}
      <div class="invoice-status-box">
        {{#if paymentStatus}}
          {{#if (eq paymentStatus "Paid")}}
            <div class="status-paid">PAID</div>
          {{else if (eq paymentStatus "Unpaid")}}
            <div class="status-unpaid">UNPAID</div>
          {{else}}
            <div class="status-draft">DRAFT</div>
          {{/if}}
          {{else}}
            <div class="status-draft">DRAFT</div>
          {{/if}}
      </div>
    </div>
  </div>

  <table class="table-wrapper">
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{this.description}}</td>
        <td>{{this.quantity}}</td>
        <td>{{this.rate}}</td>
        <td>{{../currency}}{{this.amount}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <div class="total-box mb-10">
    <div class="row">
      <p>Sub Total</p>
      <p>{{currency}}{{subtotal}}</p>
    </div>
    {{#if shippingCharge}}
      <div class="row">
        <p>Shipping</p>
        <p>{{shippingCharge}}</p>
      </div>
    {{/if}}
    
    {{#if discount}}
      <div class="row">
        <p>Discount</p>
        <p>-{{discount}}</p>
      </div>
    {{/if}}

    {{#if tax}}
      <div class="row">
        <p>Tax</p>
        <p>{{tax}}</p>
      </div>
    {{/if}}
    <div class="row">
      <p><strong>Total</strong></p>
      <p><strong>{{currency}} {{total}}</strong></p>
    </div>
    {{#if paidAmount}}
      <div class="row">
        <p>Amount Paid</p>
        <p>{{currency}} {{paidAmount}}</p>
      </div>
    {{/if}}
    <div class="balance-box">
      <div class="header">Balance</div>
      <div class="body">{{currency}} {{balance}}</div>
    </div>
  </div>

  <div class="footer">
    <div>
      <p><strong>Email</strong></p>
      <p>{{createdBy.email}}</p>
    </div>
    <div style="text-align: end;">
      {{#if qrCode}}
      <div style="display: inline-block; vertical-align: top; margin-right: 20px;">
        <p><strong>QR Code</strong></p>
        <img src="{{qrCode}}" alt="Invoice QR Code" style="max-height: 80px; max-width: 80px;" />
      </div>
      {{/if}}
      <div style="display: inline-block; vertical-align: top;">
        <p><strong>Powered By</strong></p>
        <img src="{{invoiceFooterLogo}}" alt="Powered By" />
      </div>
    </div>
  </div>
</body>

</html>

`;