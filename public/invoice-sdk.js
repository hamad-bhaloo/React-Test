/**
 * Invoice System JavaScript SDK
 * A plug-and-play solution for invoice management
 */
class InvoiceSDK {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'https://dsvtpfgkguhpkxcdquce.supabase.co/functions/v1';
    this.apiKey = config.apiKey;
    this.authToken = config.authToken;
    
    if (!this.apiKey && !this.authToken) {
      throw new Error('Either apiKey or authToken must be provided');
    }
  }

  // Private method to make API requests
  async _request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    } else if (this.authToken) {
      headers['authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}/api-invoices${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.status === 204 ? null : await response.json();
  }

  // Invoice methods
  async createInvoice(invoiceData) {
    return this._request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async getInvoices(params = {}) {
    const query = new URLSearchParams(params);
    return this._request(`/invoices?${query}`);
  }

  async getInvoice(id) {
    return this._request(`/invoices/${id}`);
  }

  async updateInvoice(id, data) {
    return this._request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInvoice(id) {
    return this._request(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  // Client methods
  async createClient(clientData) {
    return this._request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async getClients() {
    return this._request('/clients');
  }

  async getClient(id) {
    return this._request(`/clients/${id}`);
  }

  // Analytics methods
  async getAnalytics() {
    return this._request('/analytics');
  }

  // Webhook methods
  async createWebhook(webhookData) {
    return this._request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhookData),
    });
  }
}

// Widget functionality
class InvoiceWidget {
  constructor(config) {
    this.sdk = new InvoiceSDK(config);
    this.containerId = config.containerId;
    this.theme = config.theme || {};
    this.onInvoiceCreated = config.onInvoiceCreated;
    this.onError = config.onError;
  }

  // Render invoice creation form
  renderCreateForm() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container with id '${this.containerId}' not found`);
    }

    container.innerHTML = this._getCreateFormHTML();
    this._attachCreateFormEvents();
  }

  // Render invoice list
  async renderInvoiceList() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container with id '${this.containerId}' not found`);
    }

    try {
      const response = await this.sdk.getInvoices();
      container.innerHTML = this._getInvoiceListHTML(response.data || response);
    } catch (error) {
      this._handleError(error);
    }
  }

  // Render single invoice view
  async renderInvoiceView(invoiceId) {
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container with id '${this.containerId}' not found`);
    }

    try {
      const invoice = await this.sdk.getInvoice(invoiceId);
      container.innerHTML = this._getInvoiceViewHTML(invoice);
    } catch (error) {
      this._handleError(error);
    }
  }

  _getCreateFormHTML() {
    return `
      <div class="invoice-widget" style="${this._getWidgetStyles()}">
        <h3>Create Invoice</h3>
        <form id="invoice-form">
          <div class="form-group">
            <label for="client-name">Client Name</label>
            <input type="text" id="client-name" name="clientName" required>
          </div>
          <div class="form-group">
            <label for="client-email">Client Email</label>
            <input type="email" id="client-email" name="clientEmail" required>
          </div>
          <div class="form-group">
            <label for="invoice-amount">Amount</label>
            <input type="number" id="invoice-amount" name="amount" step="0.01" required>
          </div>
          <div class="form-group">
            <label for="invoice-description">Description</label>
            <textarea id="invoice-description" name="description" required></textarea>
          </div>
          <div class="form-group">
            <label for="due-date">Due Date</label>
            <input type="date" id="due-date" name="dueDate" required>
          </div>
          <button type="submit">Create Invoice</button>
        </form>
      </div>
    `;
  }

  _getInvoiceListHTML(invoices) {
    return `
      <div class="invoice-widget" style="${this._getWidgetStyles()}">
        <h3>Invoices</h3>
        <div class="invoice-list">
          ${invoices.map(invoice => `
            <div class="invoice-item" style="border: 1px solid #ddd; padding: 10px; margin: 5px 0;">
              <h4>${invoice.invoice_number}</h4>
              <p>Amount: $${invoice.total_amount}</p>
              <p>Status: ${invoice.status}</p>
              <p>Due: ${new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  _getInvoiceViewHTML(invoice) {
    return `
      <div class="invoice-widget" style="${this._getWidgetStyles()}">
        <h3>Invoice ${invoice.invoice_number}</h3>
        <div class="invoice-details">
          <p><strong>Client:</strong> ${invoice.clients?.name || 'N/A'}</p>
          <p><strong>Amount:</strong> $${invoice.total_amount}</p>
          <p><strong>Status:</strong> ${invoice.status}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          <div class="invoice-items">
            <h4>Items:</h4>
            ${invoice.invoice_items?.map(item => `
              <div style="border: 1px solid #eee; padding: 5px; margin: 2px 0;">
                <p>${item.product_name} - ${item.quantity} x $${item.rate} = $${item.amount}</p>
              </div>
            `).join('') || 'No items'}
          </div>
        </div>
      </div>
    `;
  }

  _attachCreateFormEvents() {
    const form = document.getElementById('invoice-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const invoiceData = {
        invoice_number: `INV-${Date.now()}`,
        client_id: null, // Will be created if needed
        issue_date: new Date().toISOString().split('T')[0],
        due_date: formData.get('dueDate'),
        total_amount: parseFloat(formData.get('amount')),
        status: 'draft',
        items: [{
          product_name: 'Service',
          description: formData.get('description'),
          quantity: 1,
          rate: parseFloat(formData.get('amount')),
          amount: parseFloat(formData.get('amount'))
        }]
      };

      try {
        const invoice = await this.sdk.createInvoice(invoiceData);
        if (this.onInvoiceCreated) {
          this.onInvoiceCreated(invoice);
        }
        form.reset();
        alert('Invoice created successfully!');
      } catch (error) {
        this._handleError(error);
      }
    });
  }

  _getWidgetStyles() {
    return `
      font-family: ${this.theme.fontFamily || 'Arial, sans-serif'};
      padding: 20px;
      border: 1px solid ${this.theme.borderColor || '#ddd'};
      border-radius: ${this.theme.borderRadius || '8px'};
      background-color: ${this.theme.backgroundColor || '#fff'};
      max-width: 600px;
    `.replace(/\s+/g, ' ').trim();
  }

  _handleError(error) {
    console.error('Invoice Widget Error:', error);
    if (this.onError) {
      this.onError(error);
    } else {
      alert(`Error: ${error.message}`);
    }
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InvoiceSDK, InvoiceWidget };
} else {
  window.InvoiceSDK = InvoiceSDK;
  window.InvoiceWidget = InvoiceWidget;
}