import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, AppearanceSettings } from '@/types';

const defaultAppearance: AppearanceSettings = {
  theme: 'system',
  accentColor: '#AD8B73',
  wallpaper: '',
  animationsEnabled: true,
  reducedMotion: false,
};

const defaultSettings: Settings = {
  appearance: defaultAppearance,
  system: {
    language: 'en',
    autoStart: false,
    minimizeToTray: false,
    showBootScreen: true,
  },
  applications: {
    defaultApps: {},
    startupApps: [],
  },
  privacy: {
    aiPermissions: {
      fileSearch: true,
      noteAccess: true,
      taskAccess: true,
      calendarAccess: true,
      appControl: false,
      systemInfo: true,
    },
    fileAccess: true,
    activityTracking: false,
    telemetry: false,
  },
  ai: {
    ollamaEnabled: true,
    ollamaHost: 'http://localhost:11434',
    defaultModel: 'llama3',
    systemPrompt: 'You are a helpful AI assistant integrated into an operating system.',
    temperature: 0.7,
    maxTokens: 2048,
  },
  storage: {
    databasePath: '',
    maxStorage: 1024 * 1024 * 1024,
    autoVacuum: true,
  },
};

interface SettingsState {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  updateAppearance: (partial: Partial<AppearanceSettings>) => void;
  resetSettings: () => void;
  hydrate: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      updateAppearance: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: { ...state.settings.appearance, ...partial },
          },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
      hydrate: () => {
        const stored = localStorage.getItem('ai-os-settings');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            set({ settings: { ...defaultSettings, ...parsed } });
          } catch {
            // Ignore parse errors
          }
        }
      },
    }),
    {
      name: 'ai-os-settings',
      version: 1,
      partialize: (state) => ({ settings: state.settings }),
      onRehydrateStorage: () => (state) => {
        state?.hydrate();
      },
    }
  )
);

export const useTheme = () => {
  const { settings, updateAppearance } = useSettingsStore();
  const theme = settings.appearance.theme;

  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    updateAppearance({ theme: newTheme });
  };

  return { theme: resolvedTheme, setTheme: updateAppearance, toggleTheme };
};