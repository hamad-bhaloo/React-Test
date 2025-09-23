import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type POSSettings = {
  timezone: string;
  currency: string;
  tillOpen: boolean;
};

const defaultPOSSettings: POSSettings = {
  timezone: 'UTC',
  currency: 'USD',
  tillOpen: false,
};

export const usePOSSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<POSSettings>(defaultPOSSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings_data, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading POS settings:', error);
      }

      const allSettings = (data?.settings_data as any) || {};
      const pos = allSettings.pos as POSSettings | undefined;
      setSettings({ ...defaultPOSSettings, ...(pos || {}) });
    } catch (err) {
      console.error('Failed to load POS settings:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (next: Partial<POSSettings>) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Fetch current to avoid clobbering other app settings
      const { data: existing, error: readError } = await supabase
        .from('user_settings')
        .select('settings_data, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (readError) {
        console.error('Error reading existing settings:', readError);
      }

      const existingData = (existing?.settings_data as any) || {};
      const mergedPOS = { ...(existingData.pos || defaultPOSSettings), ...next } as POSSettings;
      const newSettingsData = { ...existingData, pos: mergedPOS };

      // Update if exists; otherwise insert
      if (existing) {
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            settings_data: newSettingsData as any,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            settings_data: newSettingsData as any,
            updated_at: new Date().toISOString(),
          });
        if (insertError) throw insertError;
      }

      setSettings(mergedPOS);
      toast.success('POS settings saved');
    } catch (err: any) {
      console.error('Failed to save POS settings:', err);
      toast.error('Failed to save POS settings');
    } finally {
      setSaving(false);
    }
  };
  const setTillOpen = async (open: boolean) => {
    await save({ tillOpen: open });
  };

  return { settings, loading, saving, save, reload: load, setTillOpen };
};
