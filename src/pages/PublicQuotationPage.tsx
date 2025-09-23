import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, Phone, Mail, Calendar, Hash, DollarSign } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import QRCodeGenerator from 'qrcode';

const PublicQuotationPage = () => {
  const { quotationId } = useParams();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');

  // Create a public supabase client that bypasses RLS
  const publicSupabase = createClient(
    'https://dsvtpfgkguhpkxcdquce.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdnRwZmdrZ3VocGt4Y2RxdWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzMxMTQsImV4cCI6MjA2NjU0OTExNH0.ueAfEz7nSwVJUTR5ha_l4D9j9B2bIQOkkkDOEpd7_G0'
  );

  useEffect(() => {
    const fetchQuotation = async () => {
      if (!quotationId) return;

      try {
        const { data, error } = await publicSupabase
          .from('quotations')
          .select(`
            *,
            clients (
              id,
              name,
              first_name,
              last_name,
              email,
              company,
              phone,
              address,
              city,
              state,
              zip_code,
              country
            ),
            quotation_items (
              id,
              product_name,
              description,
              quantity,
              rate,
              amount
            )
          `)
          .eq('id', quotationId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching quotation:', error);
          throw error;
        }
        
        setQuotation(data);

        // Fetch company information if quotation exists
        if (data?.user_id) {
          const { data: companyData, error: companyError } = await publicSupabase
            .from('companies')
            .select('*')
            .eq('user_id', data.user_id)
            .maybeSingle();
          
          if (!companyError && companyData) {
            setCompany(companyData);
          }
        }
      } catch (error) {
        console.error('Error fetching quotation:', error);
        toast.error('Failed to load quotation');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [quotationId]);

  // Generate QR code for the current page
  useEffect(() => {
    if (quotation) {
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
  }, [quotation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Quotation Not Found</h1>
            <p className="text-gray-600">The quotation you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quotation?.status === 'accepted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Quotation Accepted</h1>
            <p className="text-gray-600 mb-4">This quotation has been accepted and converted to an invoice.</p>
            <div className="text-sm text-gray-500">
              <p>Quotation #{quotation.quotation_number}</p>
              <p>Amount: ${Number(quotation.total_amount).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientName = quotation.clients?.name || 
    `${quotation.clients?.first_name || ''} ${quotation.clients?.last_name || ''}`.trim() ||
    quotation.clients?.company ||
    'Valued Customer';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            {/* Company Logo */}
            {company?.logo_url && (
              <div className="mb-4">
                <img 
                  src={company.logo_url} 
                  alt={`${company.name} Logo`}
                  className="h-16 w-auto mx-auto object-contain"
                />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">Quotation #{quotation.quotation_number}</h1>
            <Badge className={quotation.status === 'accepted' ? 'bg-green-100 text-green-800' : quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
              {quotation.status?.toUpperCase()}
            </Badge>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Information */}
          {company && (
            <Card>
              <CardHeader>
                <CardTitle>From</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{company.name}</h3>
                  {company.description && (
                    <p className="text-sm text-gray-600">{company.description}</p>
                  )}
                </div>
                
                {company.address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-gray-500 mt-1" />
                    <div className="text-sm">
                      <p>{company.address}</p>
                      {(company.city || company.state || company.zip_code) && (
                        <p>
                          {[company.city, company.state, company.zip_code].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {company.country && <p>{company.country}</p>}
                    </div>
                  </div>
                )}
                
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    <span className="text-sm">{company.phone}</span>
                  </div>
                )}
                
                {company.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-500" />
                    <span className="text-sm">{company.email}</span>
                  </div>
                )}
                
                {company.website && (
                  <div className="text-sm">
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                
                {company.tax_id && (
                  <div className="text-sm text-gray-600">
                    Tax ID: {company.tax_id}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Quote To</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-bold text-lg">{clientName}</h3>
              </div>
              
              {quotation.clients?.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-500 mt-1" />
                  <div className="text-sm">
                    <p>{quotation.clients.address}</p>
                    {(quotation.clients.city || quotation.clients.state || quotation.clients.zip_code) && (
                      <p>
                        {[quotation.clients.city, quotation.clients.state, quotation.clients.zip_code].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {quotation.clients.country && <p>{quotation.clients.country}</p>}
                  </div>
                </div>
              )}
              
              {quotation.clients?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-500" />
                  <span className="text-sm">{quotation.clients.phone}</span>
                </div>
              )}
              
              {quotation.clients?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-500" />
                  <span className="text-sm">{quotation.clients.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code */}
          {qrCodeDataURL && (
            <Card>
              <CardHeader>
                <CardTitle>QR Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <img 
                  src={qrCodeDataURL} 
                  alt="Quotation QR Code" 
                  className="mx-auto mb-3"
                />
                <p className="text-xs text-gray-500">
                  Scan to share this quotation
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quotation Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Quotation Number</p>
                  <p className="font-medium">{quotation.quotation_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Issue Date</p>
                  <p className="font-medium">{new Date(quotation.issue_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Valid Until</p>
                  <p className="font-medium">{new Date(quotation.valid_until).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Currency</p>
                  <p className="font-medium">{quotation.currency || 'USD'}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm">
                <div className="col-span-5">Item</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-3 text-right">Amount</div>
              </div>
              {quotation.quotation_items?.map((item: any, index: number) => (
                <div key={item.id} className={`grid grid-cols-12 gap-4 p-4 ${index !== quotation.quotation_items.length - 1 ? 'border-b' : ''}`}>
                  <div className="col-span-5">
                    <p className="font-medium">{item.product_name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                  </div>
                  <div className="col-span-2 text-center">{item.quantity}</div>
                  <div className="col-span-2 text-right">${Number(item.rate).toFixed(2)}</div>
                  <div className="col-span-3 text-right font-medium">${Number(item.amount).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${Number(quotation.subtotal || 0).toFixed(2)}</span>
              </div>
              {quotation.tax_percentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax ({quotation.tax_percentage}%):</span>
                  <span>${Number(quotation.tax_amount || 0).toFixed(2)}</span>
                </div>
              )}
              {quotation.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span>-${Number(quotation.discount_amount || 0).toFixed(2)}</span>
                </div>
              )}
              {quotation.shipping_charge > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>${Number(quotation.shipping_charge || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${Number(quotation.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Notes and Terms */}
            {(quotation.notes || quotation.terms) && (
              <div className="mt-6 space-y-4">
                {quotation.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{quotation.notes}</p>
                  </div>
                )}
                {quotation.terms && (
                  <div>
                    <h4 className="font-medium mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-gray-600">{quotation.terms}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Watermark */}
        <div className="mt-8 py-4 text-center">
          <p className="text-xs text-gray-400 opacity-75">
            Powered by <span className="font-medium">X Invoice</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicQuotationPage;