
import React, { useState } from 'react';
import { 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus,
  Filter,
  Download,
  Search,
  Send,
  Repeat,
  DollarSign,
  TrendingUp,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWallet, useTransactions, useAddFunds } from '@/hooks/useWallet';

const PaymentPage = () => {
  const { t } = useLanguage();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const addFundsMutation = useAddFunds();
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const walletBalance = Number(wallet?.balance || 0);

  const quickActions = [
    { icon: Send, label: t('payment.send'), action: () => setShowTransferModal(true) },
    { icon: ArrowDownLeft, label: t('payment.receive'), action: () => toast.info(t('payment.receiveFunds')) },
    { icon: Repeat, label: t('payment.transfer'), action: () => setShowTransferModal(true) },
    { icon: Plus, label: t('payment.addFunds'), action: () => setShowAddFundsModal(true) }
  ];

  const quickTransferContacts = [
    { name: 'John Craig', avatar: 'JC', color: 'bg-blue-500' },
    { name: 'Charlotte', avatar: 'CH', color: 'bg-green-500' },
    { name: 'George', avatar: 'GE', color: 'bg-purple-500' },
    { name: 'William', avatar: 'WI', color: 'bg-orange-500' },
    { name: 'Theodore', avatar: 'TH', color: 'bg-red-500' },
    { name: 'Benjamin', avatar: 'BE', color: 'bg-indigo-500' },
    { name: 'Sebastian', avatar: 'SE', color: 'bg-pink-500' },
    { name: 'Michael', avatar: 'MI', color: 'bg-yellow-500' }
  ];

  const handleTransfer = () => {
    if (!transferAmount || !transferRecipient) {
      toast.error(t('payment.fillAllFields'));
      return;
    }
    
    const amount = parseFloat(transferAmount);
    if (amount > walletBalance) {
      toast.error(t('payment.insufficientBalance'));
      return;
    }
    
    toast.success(`$${amount} ${t('payment.sentSuccess')} ${transferRecipient}`);
    setShowTransferModal(false);
    setTransferAmount('');
    setTransferRecipient('');
  };

  const handleAddFunds = async () => {
    if (!addFundsAmount) {
      toast.error(t('payment.enterAmount'));
      return;
    }
    
    const amount = parseFloat(addFundsAmount);
    try {
      await addFundsMutation.mutateAsync({ amount, method: paymentMethod });
      setShowAddFundsModal(false);
      setAddFundsAmount('');
    } catch (error) {
      console.error('Error adding funds:', error);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedFilter === 'all') return true;
    return transaction.type.toLowerCase().includes(selectedFilter);
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <ArrowDownLeft className="text-green-500" size={16} />;
      case 'debit':
      case 'payment':
        return <ArrowUpRight className="text-red-500" size={16} />;
      default:
        return <DollarSign className="text-blue-500" size={16} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'text-green-600';
      case 'debit':
      case 'payment':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('payment.title')}</h1>
            <p className="text-gray-600 mt-1">{t('payment.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download size={16} />
              {t('payment.export')}
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={16} />
              {t('payment.filters')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Wallet Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Balance */}
            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet size={20} />
                  {t('payment.walletOverview')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-orange-100">{t('payment.availableBalance')}</p>
                  <p className="text-3xl font-bold">${walletBalance.toLocaleString()}</p>
                  <p className="text-sm text-orange-100">Currency: {wallet?.currency || 'USD'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('payment.quickAction')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="flex flex-col items-center gap-2 h-20"
                      onClick={action.action}
                    >
                      <action.icon size={20} />
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Transfer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('payment.quickTransfer')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {quickTransferContacts.map((contact, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <div className={`w-10 h-10 ${contact.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                        {contact.avatar}
                      </div>
                      <span className="text-xs text-center">{contact.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Transactions */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{t('payment.transactionsList')}</CardTitle>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input placeholder={t('payment.searchTransactions')} className="pl-10 w-64" />
                    </div>
                    <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('payment.all')}</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="debit">Debit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Header */}
                    <div className="grid grid-cols-6 gap-4 pb-3 text-sm font-medium text-gray-500 border-b">
                      <span>Description</span>
                      <span>Date</span>
                      <span>Method</span>
                      <span>Type</span>
                      <span>Amount</span>
                      <span>Status</span>
                    </div>

                    {/* Transactions */}
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <span className="font-medium text-gray-900">
                                {transaction.description || `${transaction.type} transaction`}
                              </span>
                              {transaction.invoices && (
                                <div className="text-xs text-gray-500">
                                  Invoice #{transaction.invoices.invoice_number}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-gray-600">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-gray-600 capitalize">
                            {transaction.payment_method || 'N/A'}
                          </span>
                          <span className={`font-medium capitalize ${getTransactionColor(transaction.type)}`}>
                            {transaction.type}
                          </span>
                          <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'credit' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                          </span>
                          <span className={`font-medium capitalize ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No transactions found
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('payment.sendMoney')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">{t('payment.recipient')}</Label>
              <Input
                id="recipient"
                placeholder={t('payment.recipientPlaceholder')}
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="amount">{t('payment.amount')}</Label>
              <Input
                id="amount"
                type="number"
                placeholder={t('payment.amountPlaceholder')}
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowTransferModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleTransfer} className="flex-1">
                {t('payment.sendMoney')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Funds Modal */}
      <Dialog open={showAddFundsModal} onOpenChange={setShowAddFundsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('payment.addFunds')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="funds-amount">{t('payment.amount')}</Label>
              <Input
                id="funds-amount"
                type="number"
                placeholder={t('payment.amountPlaceholder')}
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit Card</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddFundsModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleAddFunds} 
                className="flex-1"
                disabled={addFundsMutation.isPending}
              >
                {addFundsMutation.isPending ? 'Adding...' : t('payment.addFunds')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentPage;
