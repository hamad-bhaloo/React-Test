import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Crown, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface UserData {
  totalInvoices: number;
  totalClients: number;
  totalRevenue: number;
  pendingPayments: number;
  recentInvoices: any[];
  recentPayments: any[];
}

export const XBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm XBot, your personal assistant for X-Invoice. I can help you with information about your invoices, payments, clients, and more. What would you like to know?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription_tier, createCheckout } = useSubscription();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isPremiumUser = subscription_tier === 'Premium' || subscription_tier === 'Enterprise';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserData = async (): Promise<UserData | null> => {
    if (!user?.id) return null;

    try {
      // Fetch invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch clients
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);

      // Fetch payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const pendingPayments = invoices?.reduce((sum, inv) => {
        if (inv.payment_status === 'unpaid' || inv.payment_status === 'partial' || inv.payment_status === 'partially_paid') {
          return sum + ((inv.total_amount || 0) - (inv.paid_amount || 0));
        }
        return sum;
      }, 0) || 0;

      return {
        totalInvoices: invoices?.length || 0,
        totalClients: clients?.length || 0,
        totalRevenue,
        pendingPayments,
        recentInvoices: invoices?.slice(0, 5) || [],
        recentPayments: payments?.slice(0, 5) || [],
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Fetch user data to provide context
      const userData = await fetchUserData();

      const response = await supabase.functions.invoke('xbot-chat', {
        body: {
          message: inputMessage,
          userData,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.response || "I'm sorry, I couldn't process your request right now. Please try again.",
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleUpgrade = async () => {
    try {
      await createCheckout('Premium', 49.99);
      toast({
        title: 'Redirecting to checkout',
        description: 'You will be redirected to complete your upgrade.',
      });
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 ${
          isPremiumUser 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600' 
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
        size="icon"
      >
        {isPremiumUser ? <Crown className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    );
  }

  // Show premium chat for premium users
  if (isPremiumUser) {
    return (
      <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            <span className="font-semibold">XBot Premium</span>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground p-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">XBot is thinking...</span>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your invoices, payments, clients..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show teaser for non-premium users
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <span className="font-semibold">XBot Assistant</span>
        </div>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Teaser Content */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="h-8 w-8 text-white" />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground">
            Unlock XBot Premium
          </h3>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            Get instant answers about your invoices, payments, and clients with our AI assistant.
          </p>
        </div>

        <div className="space-y-3 w-full">
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span>Real-time business insights</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span>Invoice & payment analysis</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span>Client management tips</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span>24/7 availability</span>
          </div>
        </div>

        <Button 
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Premium
        </Button>

        <p className="text-xs text-muted-foreground">
          Try a sample question: "How much revenue did I make this month?"
        </p>
      </div>
    </div>
  );
};