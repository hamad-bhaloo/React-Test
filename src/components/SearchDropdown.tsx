
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, FileText, Building2, CreditCard } from 'lucide-react';
import { SearchResult } from '@/hooks/useGlobalSearch';

interface SearchDropdownProps {
  results: SearchResult[];
  isOpen: boolean;
  onClose: () => void;
  query: string;
}

const SearchDropdown = ({ results, isOpen, onClose, query }: SearchDropdownProps) => {
  const navigate = useNavigate();

  if (!isOpen || !query || query.length < 2) {
    return null;
  }

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    onClose();
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'client':
        return <User size={16} className="text-blue-500" />;
      case 'invoice':
        return <FileText size={16} className="text-green-500" />;
      case 'company':
        return <Building2 size={16} className="text-purple-500" />;
      case 'payment':
        return <CreditCard size={16} className="text-orange-500" />;
      default:
        return <Search size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
      {results.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <Search size={20} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No results found for "{query}"</p>
        </div>
      ) : (
        <div className="py-2">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
            Search Results ({results.length})
          </div>
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-50 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                {getIcon(result.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {result.subtitle}
                  </div>
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {result.type}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
