import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  availableCurrencies: string[];
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const { user } = useAuth();

  // Fetch available currencies from user's data
  const { data: availableCurrencies = [], isLoading } = useQuery({
    queryKey: ['available-currencies', user?.id],
    queryFn: async () => {
      if (!user?.id) return ['USD'];

      // Get unique currencies from invoices and expenses
      const { data: invoices } = await supabase
        .from('invoices')
        .select('currency')
        .eq('user_id', user.id)
        .neq('status', 'deleted');

      const { data: expenses } = await supabase
        .from('expenses')
        .select('currency')
        .eq('user_id', user.id);

      const { data: payments } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Extract unique currencies
      const currencies = new Set<string>();
      currencies.add('USD'); // Always include USD as default

      invoices?.forEach(invoice => {
        if (invoice.currency) currencies.add(invoice.currency);
      });

      expenses?.forEach(expense => {
        if (expense.currency) currencies.add(expense.currency);
      });

      // If no data exists, return just USD
      if (!invoices?.length && !expenses?.length && !payments?.length) {
        return ['USD'];
      }

      return Array.from(currencies).sort();
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Load saved currency preference or default to USD
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selected-currency');
    if (savedCurrency && availableCurrencies.includes(savedCurrency)) {
      setSelectedCurrency(savedCurrency);
    } else if (availableCurrencies.length > 0 && !availableCurrencies.includes(selectedCurrency)) {
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies]);

  // Save currency preference
  const handleSetSelectedCurrency = (currency: string) => {
    setSelectedCurrency(currency);
    localStorage.setItem('selected-currency', currency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setSelectedCurrency: handleSetSelectedCurrency,
        availableCurrencies,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};