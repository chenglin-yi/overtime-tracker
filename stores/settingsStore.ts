import { create } from 'zustand';
import { UserSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { settingsRepository } from '../database/repositories/settingsRepository';

interface SettingsState {
  settings: UserSettings;
  loading: boolean;
  
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  
  loadSettings: async () => {
    set({ loading: true });
    try {
      const settings = await settingsRepository.getSettings();
      set({ settings });
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  updateSettings: async (updates) => {
    const currentSettings = get().settings;
    const newSettings = { ...currentSettings, ...updates };
    
    try {
      await settingsRepository.update(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      console.error('更新设置失败:', error);
    }
  },
  
  resetSettings: async () => {
    try {
      await settingsRepository.update(DEFAULT_SETTINGS);
      set({ settings: DEFAULT_SETTINGS });
    } catch (error) {
      console.error('重置设置失败:', error);
    }
  }
}));
