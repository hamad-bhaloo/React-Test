import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, User, FileText, CreditCard, Building2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'client' | 'invoice' | 'payment' | 'company';
  title: string;
  subtitle: string;
  url: string;
}

interface SearchResponse {
  results: SearchResult[];
  intent: string;
  interpretation: any;
}

const AIEnhancedSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [intent, setIntent] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2 && user) {
      performAISearch(debouncedQuery);
    } else {
      setResults([]);
      setIntent(null);
    }
  }, [debouncedQuery, user]);

  const performAISearch = async (searchQuery: string) => {
    if (!user) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-enhanced-search', {
        body: { 
          query: searchQuery,
          userId: user.id 
        }
      });

      if (error) throw error;

      const searchResponse: SearchResponse = data;
      setResults(searchResponse.results);
      setIntent(searchResponse.intent);
    } catch (error) {
      console.error('AI search error:', error);
      setResults([]);
      setIntent(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'client':
        return <User size={16} className="text-blue-500" />;
      case 'invoice':
        return <FileText size={16} className="text-green-500" />;
      case 'payment':
        return <CreditCard size={16} className="text-orange-500" />;
      case 'company':
        return <Building2 size={16} className="text-purple-500" />;
      default:
        return <Search size={16} className="text-gray-500" />;
    }
  };

  const getIntentBadge = (intentType: string) => {
    const intents = {
      clients: { label: 'Clients', color: 'bg-blue-100 text-blue-800' },
      invoices: { label: 'Invoices', color: 'bg-green-100 text-green-800' },
      payments: { label: 'Payments', color: 'bg-orange-100 text-orange-800' },
      companies: { label: 'Companies', color: 'bg-purple-100 text-purple-800' },
      general: { label: 'All Results', color: 'bg-gray-100 text-gray-800' }
    };

    const intentConfig = intents[intentType as keyof typeof intents];
    if (!intentConfig) return null;

    return (
      <Badge className={`text-xs ${intentConfig.color}`}>
        <Sparkles size={12} className="mr-1" />
        AI: {intentConfig.label}
      </Badge>
    );
  };

  const quickSuggestions = [
    "unpaid invoices",
    "clients from last month", 
    "high value payments",
    "draft invoices",
    "tech clients"
  ];

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Ask AI: 'Show me unpaid invoices from last month'"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4 py-2 w-full"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-4">
              <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                Try these AI searches:
              </div>
              <div className="space-y-2">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(suggestion);
                      setIsOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <Search size={20} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="py-2">
              {intent && (
                <div className="px-4 py-2 border-b border-gray-100">
                  {getIntentBadge(intent)}
                </div>
              )}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Results ({results.length})
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
      )}
    </div>
  );
};

export default AIEnhancedSearch;