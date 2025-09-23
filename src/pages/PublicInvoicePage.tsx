
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, MapPin, Phone, Mail, Calendar, Hash, DollarSign, Download, ExternalLink, MessageCircle, Bitcoin } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeGenerator from 'qrcode';
import { downloadInvoicePDF } from '@/utils/invoiceDownload';
import { supabase } from '@/integrations/supabase/client';
import CryptoPaymentModal from '@/components/CryptoPaymentModal';

const PublicInvoicePage = () => {
  const { invoiceId, paymentLinkId } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);

// Fetch via Edge Function (service role) to respect RLS with secure token validation

useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId || !paymentLinkId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-public-invoice', {
          body: { invoiceId, paymentLinkId },
        });

        if (error) {
          console.error('Error fetching public invoice:', error);
          throw error;
        }

        if (!data?.invoice) {
          throw new Error('Invoice not found');
        }

        setInvoice(data.invoice);
        setCompany(data.company || null);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, paymentLinkId]);

  // Generate QR code for the current page
  useEffect(() => {
    if (invoice) {
      const currentURL = window.location.href;
      QRCodeGenerator.toDataURL(currentURL, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => {
        setQrCodeDataURL(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [invoice]);

  const handleDownloadPDF = async () => {
    if (!invoice || !company) {
      toast.error('Invoice data not available');
      return;
    }

    setDownloadLoading(true);
    try {
      const success = await downloadInvoicePDF(
        invoice,
        invoice.clients,
        invoice.invoice_items || [],
        company,
        'Free' // Public invoices show free tier branding
      );
      
      if (success) {
        toast.success('Invoice downloaded successfully');
      } else {
        toast.error('Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const currentUrl = window.location.href;
    const currency = invoice?.currency || 'USD';
    const currencySymbol = currency === 'PKR' ? 'Rs' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
    const message = `Check out this invoice: ${invoice?.invoice_number}\n\nAmount: ${currencySymbol}${invoice?.total_amount?.toFixed(2)}\nDue Date: ${invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}\n\nView invoice: ${currentUrl}`;
    
    // Copy URL to clipboard
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast.success('Invoice link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    
    if (navigator.share) {
      try {
        const currency = invoice?.currency || 'USD';
        const currencySymbol = currency === 'PKR' ? 'Rs' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
        await navigator.share({
          title: `Invoice ${invoice?.invoice_number}`,
          text: `Invoice for ${currencySymbol}${invoice?.total_amount?.toFixed(2)}`,
          url: currentUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(currentUrl);
        toast.success('Invoice link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
            <p className="text-gray-600">The invoice you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invoice?.payment_status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invoice Paid</h1>
            <p className="text-gray-600 mb-4">This invoice has been paid.</p>
            <div className="text-sm text-gray-500">
              <p>Invoice #{invoice.invoice_number}</p>
              <p>Amount: {(() => {
                const currency = invoice.currency || 'USD';
                const currencySymbol = currency === 'PKR' ? 'Rs' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
                return `${currencySymbol}${Number(invoice.total_amount).toFixed(2)}`;
              })()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientName = invoice.clients?.name || 
    `${invoice.clients?.first_name || ''} ${invoice.clients?.last_name || ''}`.trim() ||
    invoice.clients?.company ||
    'Valued Customer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Clean Professional Invoice */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Clean Header */}
          <div className="px-8 py-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {company?.logo_url && (
                  <img 
                    src={company.logo_url} 
                    alt={`${company.name} Logo`}
                    className="h-16 w-auto object-contain"
                  />
                )}
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">INVOICE</h1>
                  <p className="text-gray-600 text-xl font-medium">#{invoice.invoice_number}</p>
                </div>
              </div>
              
              <div className="text-right">
                <Badge className={`${invoice.payment_status === 'paid' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-blue-500 hover:bg-blue-600'} text-white border-0 text-base px-6 py-3 rounded-full`}>
                  {invoice.payment_status?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <div className="flex justify-center gap-4">
              <Button 
                onClick={handleDownloadPDF}
                disabled={downloadLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="mr-2 h-5 w-5" />
                {downloadLoading ? 'Generating...' : 'Download PDF'}
              </Button>
              
              <Button 
                onClick={handleShare}
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-white px-8 py-3 font-semibold rounded-full shadow-sm hover:shadow-md transition-all"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Share
              </Button>

              <Button 
                onClick={handleShareWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>

              {/* Show crypto payment button if invoice is unpaid */}
              {invoice.payment_status !== 'paid' && (
                <Button 
                  onClick={() => setShowCryptoModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <Bitcoin className="mr-2 h-5 w-5" />
                  Pay with Crypto
                </Button>
              )}
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-8">
            {/* Company and Client Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Company Information */}
              {company && (
                <div className="lg:col-span-1">
                  <div className="border-l-4 border-blue-600 pl-4 mb-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">FROM</h3>
                    <h4 className="text-xl font-bold text-gray-900">{company.name}</h4>
                    {company.description && (
                      <p className="text-sm text-gray-600 mt-1">{company.description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {company.address && (
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p>{company.address}</p>
                          {(company.city || company.state || company.zip_code) && (
                            <p>{[company.city, company.state, company.zip_code].filter(Boolean).join(', ')}</p>
                          )}
                          {company.country && <p>{company.country}</p>}
                        </div>
                      </div>
                    )}
                    
                    {company.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <span>{company.phone}</span>
                      </div>
                    )}
                    
                    {company.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <span>{company.email}</span>
                      </div>
                    )}
                    
                    {company.website && (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm block"
                      >
                        {company.website}
                      </a>
                    )}
                    
                    {company.tax_id && (
                      <p className="text-xs text-gray-500">Tax ID: {company.tax_id}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Client Information */}
              <div className="lg:col-span-1">
                <div className="border-l-4 border-green-600 pl-4 mb-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">BILL TO</h3>
                  <h4 className="text-xl font-bold text-gray-900">{clientName}</h4>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {invoice.clients?.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p>{invoice.clients.address}</p>
                        {(invoice.clients.city || invoice.clients.state || invoice.clients.zip_code) && (
                          <p>{[invoice.clients.city, invoice.clients.state, invoice.clients.zip_code].filter(Boolean).join(', ')}</p>
                        )}
                        {invoice.clients.country && <p>{invoice.clients.country}</p>}
                      </div>
                    </div>
                  )}
                  
                  {invoice.clients?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <span>{invoice.clients.phone}</span>
                    </div>
                  )}
                  
                  {invoice.clients?.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span>{invoice.clients.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Details & QR Code */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">INVOICE DETAILS</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice #:</span>
                      <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span className="font-semibold text-gray-900">{new Date(invoice.issue_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-semibold text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-semibold text-gray-900">{invoice.currency || 'USD'}</span>
                    </div>
                  </div>
                </div>
                
                {/* QR Code */}
                {qrCodeDataURL && (
                  <div className="text-center">
                    <img 
                      src={qrCodeDataURL} 
                      alt="Invoice QR Code" 
                      className="mx-auto mb-2 h-24 w-24 border border-gray-200 rounded"
                    />
                    <p className="text-xs text-gray-500">Scan to share</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="text-left py-4 px-6 font-semibold">DESCRIPTION</th>
                      <th className="text-center py-4 px-4 font-semibold">QTY</th>
                      <th className="text-right py-4 px-4 font-semibold">RATE</th>
                      <th className="text-right py-4 px-6 font-semibold">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.invoice_items?.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">{item.product_name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                          )}
                        </td>
                        <td className="text-center py-4 px-4 text-gray-700">
                          {item.quantity} {item.unit || 'pcs'}
                        </td>
                        <td className="text-right py-4 px-4 text-gray-700">
                          {(() => {
                            const currency = invoice.currency || 'USD';
                            const currencySymbol = currency === 'PKR' ? 'Rs' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
                            return `${currencySymbol}${Number(item.rate).toFixed(2)}`;
                          })()}
                        </td>
                        <td className="text-right py-4 px-6 font-semibold text-gray-900">
                          {(() => {
                            const currency = invoice.currency || 'USD';
                            const currencySymbol = currency === 'PKR' ? 'Rs' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
                            return `${currencySymbol}${Number(item.amount).toFixed(2)}`;
                          })()}
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="bg-gray-50 rounded-lg p-6 border">
                  <div className="space-y-3">
                    {(() => {
                      const currency = invoice.currency || 'USD';
                      const currencySymbol = currency === 'PKR' ? 'Rs' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
                      
                      return (
                        <>
                          <div className="flex justify-between text-gray-700">
                            <span>Subtotal:</span>
                            <span>{currencySymbol}{Number(invoice.subtotal || 0).toFixed(2)}</span>
                          </div>
                          
                          {invoice.discount_amount > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Discount ({invoice.discount_percentage}%):</span>
                              <span>-{currencySymbol}{Number(invoice.discount_amount).toFixed(2)}</span>
                            </div>
                          )}
                          
                          {invoice.tax_amount > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Tax ({invoice.tax_percentage}%):</span>
                              <span>{currencySymbol}{Number(invoice.tax_amount).toFixed(2)}</span>
                            </div>
                          )}
                          
                          {invoice.shipping_charge > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Shipping:</span>
                              <span>{currencySymbol}{Number(invoice.shipping_charge).toFixed(2)}</span>
                            </div>
                          )}
                          
                          <hr className="border-gray-300" />
                          
                          <div className="flex justify-between text-xl font-bold text-gray-900">
                            <span>TOTAL:</span>
                            <span className="text-blue-600">{currencySymbol}{Number(invoice.total_amount).toFixed(2)}</span>
                          </div>
                          
                          {/* Show payment details for partial payments */}
                          {Number(invoice.paid_amount || 0) > 0 && (
                            <>
                              <hr className="border-gray-300" />
                              <div className="flex justify-between text-green-600 font-medium">
                                <span>Amount Paid:</span>
                                <span>{currencySymbol}{Number(invoice.paid_amount).toFixed(2)}</span>
                              </div>
                              
                              {Number(invoice.paid_amount) < Number(invoice.total_amount) && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                                  <div className="flex justify-between text-red-600 font-bold text-lg">
                                    <span>Balance Due:</span>
                                    <span>{currencySymbol}{(Number(invoice.total_amount) - Number(invoice.paid_amount)).toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {invoice.notes && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">NOTES</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.notes}</p>
                  </div>
                )}
                
                {invoice.terms && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">TERMS & CONDITIONS</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-800 text-white px-8 py-6 text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <span className="text-xl font-bold">X Invoice</span>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Professional invoicing made simple
            </p>
            <Button 
              onClick={() => window.open('https://yourapp.com', '_blank')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 font-medium"
            >
              Try X Invoice Free
            </Button>
          </div>
        </div>

        {/* Crypto Payment Modal */}
        <CryptoPaymentModal 
          isOpen={showCryptoModal}
          onClose={() => setShowCryptoModal(false)}
          invoice={invoice}
          paymentLinkId={paymentLinkId || ''}
        />
      </div>
    </div>
  );
};

export default PublicInvoicePage;
