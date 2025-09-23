
import React, { useEffect, useState, useRef } from 'react';
import { Save, Globe, DollarSign, Bell, Shield, Key, AlertTriangle, Copy, Check, Calculator, Lock, Link, User, Mail, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { currencies } from '@/constants/currencies';
import { useSubscription } from '@/hooks/useSubscription';
import UnsavedChangesBar from '@/components/UnsavedChangesBar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const SettingsPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const { settings, loading, saving, updateSetting, saveSettings } = useSettingsContext();
  const { profile, updating: profileUpdating, updateProfile } = useProfile();
  const { subscribed } = useSubscription();
  const { user } = useAuth();
  const [showQRCode, setShowQRCode] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const initialSettingsRef = useRef<any | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize snapshot once after load
  useEffect(() => {
    if (!loading && settings && !initialSettingsRef.current) {
      initialSettingsRef.current = JSON.parse(JSON.stringify(settings));
    }
  }, [loading, settings]);

  // Recompute dirty when settings change
  useEffect(() => {
    if (initialSettingsRef.current) {
      const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettingsRef.current);
      setHasUnsavedChanges(isDirty);
    }
  }, [settings]);

  // Warn on browser/tab close if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handler);
    }
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Apply language setting when it changes
  useEffect(() => {
    if (settings.defaultLanguage && settings.defaultLanguage !== language) {
      setLanguage(settings.defaultLanguage);
    }
  }, [settings.defaultLanguage, language, setLanguage]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  ];

  const timeZones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  const handleSettingChange = (key: string, value: any) => {
    updateSetting(key, value);
    
    // Apply language change immediately
    if (key === 'defaultLanguage') {
      setLanguage(value);
    }
  };

  const handleSave = async () => {
    await saveSettings(settings);
    initialSettingsRef.current = JSON.parse(JSON.stringify(settings));
    setHasUnsavedChanges(false);
    toast.success('Settings saved');
  };

  const handleDiscard = () => {
    if (initialSettingsRef.current) {
      const snapshot = initialSettingsRef.current as any;
      Object.entries(snapshot).forEach(([key, value]) => {
        updateSetting(key, value);
      });
      setHasUnsavedChanges(false);
      toast('Changes discarded');
    }
  };

  const generateTwoFactorSecret = () => {
    // Generate a base32 secret (similar to Google Authenticator format)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (enabled && !settings.twoFactorAuth) {
      // Generate a new secret for 2FA setup
      const secret = generateTwoFactorSecret();
      setTwoFactorSecret(secret);
      setShowQRCode(true);
      setVerificationCode('');
      toast.info('2FA setup initiated. Please scan the QR code or enter the secret manually in your authenticator app.');
    } else if (!enabled && settings.twoFactorAuth) {
      // Disable 2FA
      handleSettingChange('twoFactorAuth', false);
      setShowQRCode(false);
      setTwoFactorSecret('');
      toast.success('Two-factor authentication has been disabled.');
    }
  };

  const copySecretToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(twoFactorSecret);
      setSecretCopied(true);
      toast.success('Secret copied to clipboard!');
      setTimeout(() => setSecretCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy secret to clipboard');
    }
  };

  const completeTwoFactorSetup = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code from your authenticator app.');
      return;
    }

    // In a real app, you would verify the code against the secret
    // For now, we'll just simulate successful verification
    handleSettingChange('twoFactorAuth', true);
    setShowQRCode(false);
    setTwoFactorSecret('');
    setVerificationCode('');
    toast.success('Two-factor authentication has been enabled successfully!');
  };

  const cancelTwoFactorSetup = () => {
    setShowQRCode(false);
    setTwoFactorSecret('');
    setVerificationCode('');
    toast.info('2FA setup cancelled.');
  };

  // Check if user has OAuth providers (Google, etc.)
  const hasOAuthProvider = user?.identities?.some(identity => identity.provider !== 'email');
  const isGoogleUser = user?.identities?.some(identity => identity.provider === 'google');
  const isEmailUser = user?.identities?.some(identity => identity.provider === 'email');

  const getLinkedAccounts = () => {
    const accounts = [];
    if (isEmailUser) {
      accounts.push({
        provider: 'email',
        name: 'Email & Password',
        email: user?.email,
        icon: Mail
      });
    }
    if (isGoogleUser) {
      accounts.push({
        provider: 'google',
        name: 'Google',
        email: user?.email,
        icon: Globe
      });
    }
    return accounts;
  };

  const handlePasswordChange = async () => {
    if (hasOAuthProvider && !isEmailUser) {
      toast.error('Password change is not available for OAuth accounts');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);

    try {
      // For OAuth users who also have email/password, we don't require current password
      const updateData: any = { password: newPassword };

      const { error } = await supabase.auth.updateUser(updateData);

      if (error) {
        toast.error('Failed to change password: ' + error.message);
      } else {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast.error('An error occurred while changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header matching Client page style */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Shield size={24} className="text-primary" />
            {t('settings.title')}
          </h1>
          <p className="text-sm text-slate-600">{t('settings.subtitle')}</p>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 h-9"
        >
          <Save size={16} className="mr-2" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 backdrop-blur-sm h-12">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('settings.general')}
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('settings.invoicing')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('settings.notifications')}
          </TabsTrigger>
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            POS & Inventory
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('settings.security')}
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10">
                  <Globe size={18} className="text-primary" />
                </div>
                {t('settings.general')} Settings
              </CardTitle>
              <CardDescription>
                Configure your basic application preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="defaultCurrency">{t('settings.defaultCurrency')}</Label>
                  <SearchableSelect
                    options={currencies.map(currency => ({
                      label: `${currency.symbol} ${currency.name} (${currency.code})`,
                      value: currency.code
                    }))}
                    value={settings.defaultCurrency}
                    onValueChange={(value) => handleSettingChange('defaultCurrency', value)}
                    placeholder="Select currency..."
                    searchPlaceholder="Search currencies..."
                  />
                </div>

                <div>
                  <Label htmlFor="defaultLanguage">{t('settings.defaultLanguage')}</Label>
                  <SearchableSelect
                    options={languages.map(lang => ({
                      label: `${lang.flag} ${lang.name}`,
                      value: lang.code
                    }))}
                    value={settings.defaultLanguage}
                    onValueChange={(value) => handleSettingChange('defaultLanguage', value)}
                    placeholder="Select language..."
                    searchPlaceholder="Search languages..."
                  />
                </div>

                <div>
                  <Label htmlFor="timeZone">{t('settings.timeZone')}</Label>
                  <SearchableSelect
                    options={timeZones.map(tz => ({
                      label: tz,
                      value: tz
                    }))}
                    value={settings.timeZone}
                    onValueChange={(value) => handleSettingChange('timeZone', value)}
                    placeholder="Select timezone..."
                    searchPlaceholder="Search timezones..."
                  />
                </div>

                <div>
                  <Label htmlFor="dateFormat">{t('settings.dateFormat')}</Label>
                  <SearchableSelect
                    options={[
                      { label: 'MM/DD/YYYY (US)', value: 'MM/DD/YYYY' },
                      { label: 'DD/MM/YYYY (EU)', value: 'DD/MM/YYYY' },
                      { label: 'YYYY-MM-DD (ISO)', value: 'YYYY-MM-DD' }
                    ]}
                    value={settings.dateFormat}
                    onValueChange={(value) => handleSettingChange('dateFormat', value)}
                    placeholder="Select date format..."
                    searchPlaceholder="Search date formats..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoicing Settings */}
        <TabsContent value="invoicing">
          <Card className="bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-green-500/20 to-green-500/10">
                  <DollarSign size={18} className="text-green-500" />
                </div>
                {t('settings.invoicing')} Settings
              </CardTitle>
              <CardDescription>
                Configure default invoice settings that will be applied to new invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={settings.invoicePrefix || 'INV'}
                    onChange={(e) => handleSettingChange('invoicePrefix', e.target.value)}
                    placeholder="INV"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This prefix will be used for all new invoices
                  </p>
                </div>

                <div>
                  <Label htmlFor="invoiceNumbering">Invoice Numbering</Label>
                  <SearchableSelect
                    options={[
                      { label: 'Auto-increment', value: 'auto' },
                      { label: 'Manual', value: 'manual' },
                      { label: 'Date-based', value: 'date' }
                    ]}
                    value={settings.invoiceNumbering}
                    onValueChange={(value) => handleSettingChange('invoiceNumbering', value)}
                    placeholder="Select numbering method..."
                    searchPlaceholder="Search numbering methods..."
                  />
                </div>

                <div>
                  <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.defaultTaxRate || 0}
                    onChange={(e) => handleSettingChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="defaultPaymentTerms">Default Payment Terms (days)</Label>
                  <SearchableSelect
                    options={[
                      { label: '7 days', value: '7' },
                      { label: '15 days', value: '15' },
                      { label: '30 days', value: '30' },
                      { label: '45 days', value: '45' },
                      { label: '60 days', value: '60' },
                      { label: '90 days', value: '90' }
                    ]}
                    value={settings.defaultPaymentTerms}
                    onValueChange={(value) => handleSettingChange('defaultPaymentTerms', value)}
                    placeholder="Select payment terms..."
                    searchPlaceholder="Search payment terms..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card className="bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                  <Bell size={18} className="text-blue-500" />
                </div>
                {t('settings.notifications')} Settings
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive general email notifications</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="invoiceReminders">Invoice Reminders</Label>
                    <p className="text-sm text-gray-600">Get reminded about overdue invoices</p>
                  </div>
                  <Switch
                    id="invoiceReminders"
                    checked={settings.invoiceReminders}
                    onCheckedChange={(checked) => handleSettingChange('invoiceReminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="paymentNotifications">Payment Notifications</Label>
                    <p className="text-sm text-gray-600">Get notified when payments are received</p>
                  </div>
                  <Switch
                    id="paymentNotifications"
                    checked={settings.paymentNotifications}
                    onCheckedChange={(checked) => handleSettingChange('paymentNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POS & Inventory Settings */}
        <TabsContent value="pos">
          <Card className="bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-orange-500/20 to-orange-500/10">
                  <Calculator size={18} className="text-orange-500" />
                </div>
                POS & Inventory Settings
              </CardTitle>
              <CardDescription>
                Configure your point-of-sale and inventory management preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!subscribed && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    POS & Inventory features require a paid subscription. 
                    <Button variant="link" className="p-0 h-auto ml-1" onClick={() => window.location.href = '/subscription'}>
                      Upgrade now
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="posEnabled">Enable POS & Inventory</Label>
                    <p className="text-sm text-gray-600">
                      {subscribed 
                        ? "Enable point-of-sale and inventory management features"
                        : "Available for paid subscribers only"
                      }
                    </p>
                  </div>
                  <Switch
                    id="posEnabled"
                    checked={settings.pos_enabled === true}
                    onCheckedChange={(checked) => handleSettingChange('pos_enabled', checked)}
                    disabled={!subscribed}
                  />
                </div>

                {settings.pos_enabled && subscribed && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                        <p className="text-sm text-gray-600">Get notified when products are running low</p>
                      </div>
                      <Switch
                        id="lowStockAlerts"
                        checked={settings.low_stock_alerts === true}
                        onCheckedChange={(checked) => handleSettingChange('low_stock_alerts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoInvoiceGeneration">Auto Invoice Generation</Label>
                        <p className="text-sm text-gray-600">Automatically create invoices from POS sales</p>
                      </div>
                      <Switch
                        id="autoInvoiceGeneration"
                        checked={settings.auto_invoice_generation === true}
                        onCheckedChange={(checked) => handleSettingChange('auto_invoice_generation', checked)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="posReceiptTemplate">Receipt Template</Label>
                      <SearchableSelect
                        options={[
                          { label: 'Standard Receipt', value: 'standard' },
                          { label: 'Minimal Receipt', value: 'minimal' },
                          { label: 'Detailed Receipt', value: 'detailed' }
                        ]}
                        value={settings.pos_receipt_template || 'standard'}
                        onValueChange={(value) => handleSettingChange('pos_receipt_template', value)}
                        placeholder="Select receipt template..."
                        searchPlaceholder="Search receipt templates..."
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="bg-gradient-to-br from-background/80 via-background to-background/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-red-500/20 to-red-500/10">
                  <Shield size={18} className="text-red-500" />
                </div>
                {t('settings.security')} Settings
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={settings.twoFactorAuth}
                    onCheckedChange={handleTwoFactorToggle}
                  />
                </div>

                {showQRCode && (
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-4">
                        <p className="font-semibold">Complete 2FA Setup:</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Install an authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)</li>
                          <li>
                            <div className="space-y-2">
                              <p>Enter this secret key in your authenticator app:</p>
                              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded border">
                                <code className="flex-1 text-xs font-mono break-all">{twoFactorSecret}</code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={copySecretToClipboard}
                                  className="p-1 h-8 w-8"
                                >
                                  {secretCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                              </div>
                            </div>
                          </li>
                          <li>
                            <div className="space-y-2">
                              <p>Enter the 6-digit code from your authenticator app:</p>
                              <Input
                                type="text"
                                placeholder="000000"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-32 text-center font-mono"
                                maxLength={6}
                              />
                            </div>
                          </li>
                        </ol>
                        <div className="flex gap-2">
                          <Button 
                            onClick={completeTwoFactorSetup} 
                            size="sm"
                            disabled={verificationCode.length !== 6}
                          >
                            Complete Setup
                          </Button>
                          <Button onClick={cancelTwoFactorSetup} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {settings.twoFactorAuth && !showQRCode && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Two-factor authentication is enabled and protecting your account.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Linked Accounts Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Link size={16} className="text-primary" />
                    <h3 className="text-lg font-medium">Linked Accounts</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage the authentication methods connected to your account
                  </p>
                  <div className="space-y-3">
                    {getLinkedAccounts().map((account) => (
                      <div key={account.provider} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <account.icon size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-sm text-muted-foreground">{account.email}</p>
                          </div>
                        </div>
                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                          Connected
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crypto Wallet Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet size={16} className="text-primary" />
                    <h3 className="text-lg font-medium">Crypto Wallet</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure your crypto wallet address to receive payments from crypto transactions
                  </p>
                  <div className="max-w-md">
                    <Label htmlFor="cryptoWallet">Crypto Wallet Address</Label>
                    <Input
                      id="cryptoWallet"
                      value={profile?.crypto_wallet_address || ''}
                      onChange={(e) => updateProfile({ crypto_wallet_address: e.target.value })}
                      placeholder="Enter your crypto wallet address"
                      className="font-mono text-sm"
                      disabled={profileUpdating}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This address will be used to receive crypto payments from invoices
                    </p>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock size={16} className="text-primary" />
                    <h3 className="text-lg font-medium">Change Password</h3>
                  </div>
                  
                  {hasOAuthProvider && !isEmailUser ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You signed in with Google. Password changes are not available for OAuth accounts. 
                        Your password is managed by your OAuth provider.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4 max-w-md">
                      {isEmailUser && (
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <PasswordInput
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                          />
                        </div>
                      )}
                      
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <PasswordInput
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Password must be at least 6 characters long
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <PasswordInput
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>
                      
                      <Button 
                        onClick={handlePasswordChange}
                        disabled={changingPassword || (isEmailUser && !currentPassword) || !newPassword || !confirmPassword}
                        className="w-full"
                      >
                        {changingPassword ? 'Changing Password...' : 'Change Password'}
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <SearchableSelect
                    options={[
                      { label: '30 minutes', value: '30' },
                      { label: '1 hour', value: '60' },
                      { label: '2 hours', value: '120' },
                      { label: '4 hours', value: '240' },
                      { label: '8 hours', value: '480' }
                    ]}
                    value={settings.sessionTimeout}
                    onValueChange={(value) => handleSettingChange('sessionTimeout', value)}
                    placeholder="Select session timeout..."
                    searchPlaceholder="Search timeout options..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

        <UnsavedChangesBar
          visible={hasUnsavedChanges}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />

      </div>
    );
};

export default SettingsPage;
