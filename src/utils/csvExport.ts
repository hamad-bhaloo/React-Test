export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    return;
  }

  // Get all unique keys from all objects
  const headers = Array.from(
    new Set(
      data.flatMap(item => Object.keys(item))
    )
  );

  // Create CSV content
  const csvContent = [
    // Headers
    headers.join(','),
    // Data rows
    ...data.map(item => 
      headers.map(header => {
        const value = item[header];
        // Handle null/undefined values
        if (value === null || value === undefined) {
          return '';
        }
        // Handle objects/arrays - stringify them
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Handle strings with commas or quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportClientsCSV = (clients: any[]) => {
  const exportData = clients.map(client => ({
    id: client.id,
    name: client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim(),
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email,
    phone: client.phone,
    company: client.company,
    client_type: client.client_type,
    job_title: client.job_title,
    website: client.website,
    tax_number: client.tax_number,
    registration_number: client.registration_number,
    industry: client.industry,
    contact_person: client.contact_person,
    contact_person_email: client.contact_person_email,
    contact_person_phone: client.contact_person_phone,
    address: client.address,
    city: client.city,
    state: client.state,
    zip_code: client.zip_code,
    country: client.country,
    status: client.status,
    date_of_birth: client.date_of_birth,
    gender: client.gender,
    linkedin_profile: client.linkedin_profile,
    twitter_profile: client.twitter_profile,
    facebook_profile: client.facebook_profile,
    instagram_profile: client.instagram_profile,
    notes: client.notes,
    created_at: client.created_at,
    updated_at: client.updated_at
  }));

  downloadCSV(exportData, 'clients_export');
};

export const exportInvoicesCSV = (invoices: any[]) => {
  const exportData = invoices.map(invoice => ({
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    client_name: invoice.clients?.name || `${invoice.clients?.first_name || ''} ${invoice.clients?.last_name || ''}`.trim(),
    client_email: invoice.clients?.email,
    client_company: invoice.clients?.company,
    status: invoice.status,
    payment_status: invoice.payment_status,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    subtotal: invoice.subtotal,
    tax_percentage: invoice.tax_percentage,
    tax_amount: invoice.tax_amount,
    discount_percentage: invoice.discount_percentage,
    discount_amount: invoice.discount_amount,
    shipping_charge: invoice.shipping_charge,
    total_amount: invoice.total_amount,
    paid_amount: invoice.paid_amount,
    outstanding_amount: (invoice.total_amount || 0) - (invoice.paid_amount || 0),
    currency: invoice.currency,
    terms: invoice.terms,
    notes: invoice.notes,
    is_recurring: invoice.is_recurring,
    recurring_frequency: invoice.recurring_frequency,
    recurring_end_date: invoice.recurring_end_date,
    reminder_count: invoice.reminder_count,
    sent_at: invoice.sent_at,
    last_viewed_at: invoice.last_viewed_at,
    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
    // Stats
    days_overdue: invoice.due_date ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))) : 0,
    payment_completion_rate: invoice.total_amount > 0 ? ((invoice.paid_amount || 0) / invoice.total_amount * 100).toFixed(2) + '%' : '0%'
  }));

  downloadCSV(exportData, 'invoices_export');
};