
import { supabase } from '@/integrations/supabase/client';

interface NotificationSettings {
  emailNotifications: boolean;
  invoiceReminders: boolean;
  paymentNotifications: boolean;
}

export const shouldSendNotification = async (
  userId: string, 
  notificationType: keyof NotificationSettings
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('user_id', userId)
      .single();

    if (error || !data?.settings_data) {
      // Default to true if no settings found
      return true;
    }

    return data.settings_data[notificationType] !== false;
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to sending notifications on error
  }
};

export const createNotificationIfEnabled = async (
  userId: string,
  notificationType: keyof NotificationSettings,
  notification: {
    type: string;
    title: string;
    message: string;
    related_id?: string;
    related_type?: string;
  }
) => {
  const shouldSend = await shouldSendNotification(userId, notificationType);
  
  if (shouldSend) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          ...notification
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
};
