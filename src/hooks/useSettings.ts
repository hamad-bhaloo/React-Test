
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AppSettings {
  // General Settings (removed companyName)
  defaultCurrency: string;
  defaultLanguage: string;
  timeZone: string;
  dateFormat: string;
  
  // Invoice Settings
  invoicePrefix: string;
  invoiceNumbering: string;
  defaultTaxRate: number;
  defaultPaymentTerms: string;
  selectedTemplate: number;
  
  // Notifications
  emailNotifications: boolean;
  invoiceReminders: boolean;
  paymentNotifications: boolean;
  
  // Security
  twoFactorAuth: boolean;
  sessionTimeout: string;
}

const defaultSettings: AppSettings = {
  defaultCurrency: 'USD',
  defaultLanguage: 'en',
  timeZone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  invoicePrefix: 'INV',
  invoiceNumbering: 'auto',
  defaultTaxRate: 0,
  defaultPaymentTerms: '30',
  selectedTemplate: 1,
  emailNotifications: true,
  invoiceReminders: true,
  paymentNotifications: true,
  twoFactorAuth: false,
  sessionTimeout: '60',
};

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('settings_data')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading settings:', error);
          return;
        }

        if (data?.settings_data && typeof data.settings_data === 'object' && data.settings_data !== null) {
          setSettings(prev => ({
            ...prev,
            ...(data.settings_data as Partial<AppSettings>)
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  // Save settings to Supabase
  const saveSettings = async (newSettings?: Partial<AppSettings>) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const settingsToSave = newSettings ? { ...settings, ...newSettings } : settings;
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings_data: settingsToSave as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving settings:', error);
        toast.error('Failed to save settings');
        return;
      }

      setSettings(settingsToSave);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    loading,
    saving,
    updateSetting,
    saveSettings
  };
};
