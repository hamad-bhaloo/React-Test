import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencyCombobox } from "@/components/ui/currency-combobox";
import { DollarSign } from "lucide-react";

const CurrencySelector = () => {
  const { selectedCurrency, setSelectedCurrency, availableCurrencies, isLoading } = useCurrency();

  if (isLoading || availableCurrencies.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
      <DollarSign size={16} className="text-slate-500" />
      <CurrencyCombobox
        value={selectedCurrency}
        onValueChange={setSelectedCurrency}
        placeholder="Select currency"
        className="w-32 border-0 bg-transparent p-0 h-auto text-sm font-medium text-slate-700"
      />
    </div>
  );
};

export default CurrencySelector;