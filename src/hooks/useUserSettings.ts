
import { useSettingsContext } from '@/contexts/SettingsContext';

export const useUserSettings = () => {
  const { settings } = useSettingsContext();

  const getInvoiceDefaults = () => ({
    prefix: settings.invoicePrefix || 'INV',
    currency: settings.defaultCurrency || 'USD',
    taxRate: settings.defaultTaxRate || 0,
    paymentTerms: parseInt(settings.defaultPaymentTerms || '30'),
    numbering: settings.invoiceNumbering || 'auto'
  });

  const getDateFormat = () => settings.dateFormat || 'MM/DD/YYYY';
  
  const getTimeZone = () => settings.timeZone || 'UTC';
  
  const getCurrency = () => settings.defaultCurrency || 'USD';

  const formatDate = (date: Date) => {
    const format = getDateFormat();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: getTimeZone()
    };

    switch (format) {
      case 'DD/MM/YYYY':
        return new Intl.DateTimeFormat('en-GB', options).format(date);
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];
      case 'MM/DD/YYYY':
      default:
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = getCurrency();
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return {
    settings,
    getInvoiceDefaults,
    getDateFormat,
    getTimeZone,
    getCurrency,
    formatDate,
    formatCurrency
  };
};
