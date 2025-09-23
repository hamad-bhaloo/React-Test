import { getTemplateConfig } from '@/templates/invoiceTemplates';
import { supabase } from '@/integrations/supabase/client';

export const getSelectedTemplate = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      console.log('No authenticated user found, using default template');
      return getTemplateConfig(1);
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading user settings:', error);
      return getTemplateConfig(1);
    }

    const settingsData = data?.settings_data as any;
    const selectedTemplateId = settingsData?.selectedTemplate || 1;
    console.log('Using template ID:', selectedTemplateId);
    
    return getTemplateConfig(selectedTemplateId);
  } catch (error) {
    console.error('Error getting selected template:', error);
    return getTemplateConfig(1);
  }
};