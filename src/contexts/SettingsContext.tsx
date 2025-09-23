
import React, { createContext, useContext } from 'react';
import { useSettings } from '@/hooks/useSettings';

interface SettingsContextType {
  settings: any;
  loading: boolean;
  saving: boolean;
  updateSetting: (key: string, value: any) => void;
  saveSettings: (settings: any) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const settingsData = useSettings();

  return (
    <SettingsContext.Provider value={settingsData}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};
