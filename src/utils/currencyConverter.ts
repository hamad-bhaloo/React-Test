// Currency conversion utilities for multi-currency expense tracking
export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

// Mock exchange rates - in a real app, you'd fetch from an API like exchangerate-api.com
const MOCK_EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: {
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.5,
    CAD: 1.25,
    AUD: 1.35,
    INR: 75.5,
    CNY: 6.45,
    BRL: 5.2,
    MXN: 20.1,
    ZAR: 15.8,
    NGN: 411.5,
    KES: 108.5,
    GHS: 6.1,
    EGP: 15.7,
    TRY: 8.9,
    CHF: 0.92,
    SEK: 8.7,
    NOK: 8.6,
    DKK: 6.3,
    PKR: 278.5,
    BDT: 109.8,
    LKR: 295.2,
    NPR: 120.8,
    AFN: 89.2,
    MMK: 2095.0,
    LAK: 13250.0,
    KHR: 4085.0,
    BND: 1.35,
    FJD: 2.22,
    TOP: 2.34,
    WST: 2.68,
    SBD: 8.45,
    VUV: 118.5,
    PGK: 3.72,
    ETB: 55.8,
    TZS: 2315.0,
    UGX: 3675.0,
    RWF: 1285.0,
    BWP: 13.2,
    SZL: 18.5,
    LSL: 18.5,
    MWK: 1085.0,
    ZMW: 18.9,
    MZN: 63.8,
    AOA: 825.0,
    NAD: 18.5,
    GMD: 67.5,
    SLL: 19750.0,
    LRD: 185.0,
    CVE: 98.5,
    STN: 22.8,
    GNF: 8625.0,
    BIF: 2875.0,
    DJF: 178.0,
    ERN: 15.0,
    SOS: 570.0,
    KMF: 445.0,
    SCR: 13.8,
    MUR: 45.2,
    MVR: 15.4,
    ALL: 92.5,
    MKD: 56.8,
    RSD: 108.5,
    BAM: 1.78,
    GEL: 2.68,
    AMD: 386.5,
    AZN: 1.7,
    BYN: 2.58,
    KZT: 452.0,
    KGS: 85.2,
    TJS: 10.8,
    TMT: 3.5,
    UZS: 12750.0,
    MNT: 2695.0,
  },
  EUR: {
    USD: 1.18,
    GBP: 0.86,
    JPY: 130.2,
    CAD: 1.47,
    AUD: 1.59,
    INR: 88.9,
    CNY: 7.6,
    BRL: 6.12,
    MXN: 23.7,
    ZAR: 18.6,
    NGN: 484.5,
    KES: 127.8,
    GHS: 7.18,
    EGP: 18.5,
    TRY: 10.5,
    CHF: 1.08,
    SEK: 10.2,
    NOK: 10.1,
    DKK: 7.4,
    PKR: 328.4,
    BDT: 129.6,
    LKR: 348.1,
    NPR: 142.5,
    AFN: 105.2,
    MMK: 2472.1,
    LAK: 15635.0,
    KHR: 4820.3,
    BND: 1.59,
    FJD: 2.62,
    TOP: 2.76,
    WST: 3.16,
    SBD: 9.97,
    VUV: 139.8,
    PGK: 4.39,
    ETB: 65.8,
    TZS: 2731.7,
    UGX: 4336.5,
    RWF: 1516.3,
    BWP: 15.6,
    SZL: 21.8,
    LSL: 21.8,
    MWK: 1280.3,
    ZMW: 22.3,
    MZN: 75.3,
    AOA: 973.5,
    NAD: 21.8,
    GMD: 79.7,
    SLL: 23305.0,
    LRD: 218.3,
    CVE: 116.2,
    STN: 26.9,
    GNF: 10177.5,
    BIF: 3392.5,
    DJF: 210.0,
    ERN: 17.7,
    SOS: 672.6,
    KMF: 525.1,
    SCR: 16.3,
    MUR: 53.3,
    MVR: 18.2,
    ALL: 109.2,
    MKD: 67.0,
    RSD: 128.0,
    BAM: 2.10,
    GEL: 3.16,
    AMD: 456.1,
    AZN: 2.0,
    BYN: 3.04,
    KZT: 533.4,
    KGS: 100.5,
    TJS: 12.7,
    TMT: 4.1,
    UZS: 15045.0,
    MNT: 3180.1,
  }
};

// Add reverse rates for all currency pairs
Object.keys(MOCK_EXCHANGE_RATES).forEach(fromCurrency => {
  Object.keys(MOCK_EXCHANGE_RATES[fromCurrency]).forEach(toCurrency => {
    if (!MOCK_EXCHANGE_RATES[toCurrency]) {
      MOCK_EXCHANGE_RATES[toCurrency] = {};
    }
    if (!MOCK_EXCHANGE_RATES[toCurrency][fromCurrency]) {
      MOCK_EXCHANGE_RATES[toCurrency][fromCurrency] = 1 / MOCK_EXCHANGE_RATES[fromCurrency][toCurrency];
    }
  });
});

// Add self-reference rates (USD to USD = 1)
Object.keys(MOCK_EXCHANGE_RATES).forEach(currency => {
  MOCK_EXCHANGE_RATES[currency][currency] = 1;
});

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = MOCK_EXCHANGE_RATES[fromCurrency]?.[toCurrency];
  if (!rate) {
    console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}, using 1:1 rate`);
    return amount;
  }

  return amount * rate;
};

export const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const rate = MOCK_EXCHANGE_RATES[fromCurrency]?.[toCurrency];
  if (!rate) {
    console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}, using 1:1 rate`);
    return 1;
  }

  return rate;
};

export const formatCurrencyWithCode = (amount: number, currency: string, locale = 'en-US'): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is not supported
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const getSupportedCurrencies = (): string[] => {
  return Object.keys(MOCK_EXCHANGE_RATES).sort();
};

// Real-world API integration placeholder
export const fetchExchangeRates = async (baseCurrency: string): Promise<Record<string, number>> => {
  // In a real app, you would fetch from an API like:
  // const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
  // return response.json().rates;
  
  return MOCK_EXCHANGE_RATES[baseCurrency] || {};
};