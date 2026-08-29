import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMetadata, AppCategory } from '@shared/types';

const systemApps: AppMetadata[] = [
  {
    id: 'file-manager',
    name: 'File Manager',
    description: 'Browse and manage files and folders',
    icon: 'folder',
    category: 'system',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '2.4 MB',
    installed: true,
    executable: 'FileManager',
    keywords: ['files', 'folders', 'explorer', 'manager'],
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Command line interface',
    icon: 'terminal',
    category: 'system',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '1.8 MB',
    installed: true,
    executable: 'Terminal',
    keywords: ['command', 'shell', 'cli', 'bash'],
  },
  {
    id: 'notes',
    name: 'Notes',
    description: 'Create and manage notes',
    icon: 'file-text',
    category: 'productivity',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '3.1 MB',
    installed: true,
    executable: 'Notes',
    keywords: ['notes', 'memos', 'writing', 'markdown'],
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Scientific calculator',
    icon: 'calculator',
    category: 'utilities',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '1.2 MB',
    installed: true,
    executable: 'Calculator',
    keywords: ['math', 'calculate', 'arithmetic'],
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Manage events and schedule',
    icon: 'calendar',
    category: 'productivity',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '2.8 MB',
    installed: true,
    executable: 'Calendar',
    keywords: ['events', 'schedule', 'appointments', 'reminders'],
  },
  {
    id: 'task-manager',
    name: 'Task Manager',
    description: 'Manage tasks and todos',
    icon: 'check-square',
    category: 'productivity',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '2.5 MB',
    installed: true,
    executable: 'TaskManager',
    keywords: ['tasks', 'todos', 'productivity', 'kanban'],
  },
  {
    id: 'app-store',
    name: 'App Store',
    description: 'Discover and install applications',
    icon: 'store',
    category: 'system',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '2.0 MB',
    installed: true,
    executable: 'AppStore',
    keywords: ['apps', 'install', 'store', 'marketplace'],
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'System settings and preferences',
    icon: 'settings',
    category: 'settings',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '1.5 MB',
    installed: true,
    executable: 'Settings',
    keywords: ['preferences', 'configuration', 'options', 'control panel'],
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Local AI chat assistant',
    icon: 'bot',
    category: 'ai',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '3.5 MB',
    installed: true,
    executable: 'AIAssistant',
    keywords: ['ai', 'chat', 'assistant', 'ollama', 'llm'],
  },
  {
    id: 'system-monitor',
    name: 'System Monitor',
    description: 'View system resources and processes',
    icon: 'activity',
    category: 'system',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '2.2 MB',
    installed: true,
    executable: 'SystemMonitor',
    keywords: ['monitor', 'resources', 'cpu', 'memory', 'processes'],
  },
  {
    id: 'about',
    name: 'About',
    description: 'System information and credits',
    icon: 'info',
    category: 'system',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '0.8 MB',
    installed: true,
    executable: 'About',
    keywords: ['info', 'version', 'credits', 'license'],
  },
];

const availableApps: AppMetadata[] = [
  ...systemApps,
  {
    id: 'text-editor',
    name: 'Text Editor',
    description: 'Code and text editor with syntax highlighting',
    icon: 'code',
    category: 'development',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '5.2 MB',
    installed: false,
    executable: 'TextEditor',
    keywords: ['editor', 'code', 'ide', 'syntax'],
  },
  {
    id: 'music-player',
    name: 'Music Player',
    description: 'Play audio files and manage playlists',
    icon: 'music',
    category: 'media',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '4.8 MB',
    installed: false,
    executable: 'MusicPlayer',
    keywords: ['music', 'audio', 'player', 'playlist'],
  },
  {
    id: 'image-viewer',
    name: 'Image Viewer',
    description: 'View and manage images',
    icon: 'image',
    category: 'media',
    version: '1.0.0',
    developer: 'AI OS Team',
    size: '3.6 MB',
    installed: false,
    executable: 'ImageViewer',
    keywords: ['images', 'photos', 'viewer', 'gallery'],
  },
];

interface AppStoreState {
  apps: AppMetadata[];
  installedApps: AppMetadata[];
  pinnedApps: string[];
  recentApps: string[];
  getApp: (id: string) => AppMetadata | undefined;
  getAppsByCategory: (category: AppCategory) => AppMetadata[];
  getInstalledApps: () => AppMetadata[];
  getPinnedApps: () => AppMetadata[];
  getRecentApps: () => AppMetadata[];
  searchApps: (query: string) => AppMetadata[];
  installApp: (appId: string) => Promise<boolean>;
  uninstallApp: (appId: string) => Promise<boolean>;
  pinApp: (appId: string) => void;
  unpinApp: (appId: string) => void;
  addRecentApp: (appId: string) => void;
  launchApp: (appId: string) => void;
  registerApp: (app: AppMetadata) => void;
  updateApp: (appId: string, updates: Partial<AppMetadata>) => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      apps: availableApps,
      installedApps: availableApps.filter((a) => a.installed),
      pinnedApps: ['file-manager', 'terminal', 'notes', 'settings'],
      recentApps: [],

      getApp: (id) => get().apps.find((a) => a.id === id),

      getAppsByCategory: (category) =>
        get().apps.filter((a) => a.category === category),

      getInstalledApps: () => get().installedApps,

      getPinnedApps: () =>
        get().pinnedApps.map((id) => get().apps.find((a) => a.id === id)).filter(Boolean) as AppMetadata[],

      getRecentApps: () =>
        get().recentApps.map((id) => get().apps.find((a) => a.id === id)).filter(Boolean) as AppMetadata[],

      searchApps: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().apps.filter(
          (app) =>
            app.name.toLowerCase().includes(lowerQuery) ||
            app.description.toLowerCase().includes(lowerQuery) ||
            app.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))
        );
      },

      installApp: async (appId) => {
        const app = get().apps.find((a) => a.id === appId);
        if (!app || app.installed) return false;

        set((state) => ({
          apps: state.apps.map((a) =>
            a.id === appId ? { ...a, installed: true } : a
          ),
          installedApps: [...state.installedApps, { ...app, installed: true }],
        }));

        return true;
      },

      uninstallApp: async (appId) => {
        const app = get().apps.find((a) => a.id === appId);
        if (!app || !app.installed || app.category === 'system') return false;

        set((state) => ({
          apps: state.apps.map((a) =>
            a.id === appId ? { ...a, installed: false } : a
          ),
          installedApps: state.installedApps.filter((a) => a.id !== appId),
          pinnedApps: state.pinnedApps.filter((id) => id !== appId),
        }));

        return true;
      },

      pinApp: (appId) => {
        const { pinnedApps } = get();
        if (!pinnedApps.includes(appId)) {
          set({ pinnedApps: [...pinnedApps, appId] });
        }
      },

      unpinApp: (appId) => {
        const { pinnedApps } = get();
        set({ pinnedApps: pinnedApps.filter((id) => id !== appId) });
      },

      addRecentApp: (appId) => {
        const { recentApps } = get();
        const filtered = recentApps.filter((id) => id !== appId);
        set({ recentApps: [appId, ...filtered].slice(0, 10) });
      },

      launchApp: (appId) => {
        get().addRecentApp(appId);
      },

      registerApp: (app) => {
        const { apps } = get();
        if (!apps.find((a) => a.id === app.id)) {
          set({ apps: [...apps, app] });
        }
      },

      updateApp: (appId, updates) => {
        set((state) => ({
          apps: state.apps.map((a) =>
            a.id === appId ? { ...a, ...updates } : a
          ),
          installedApps: state.installedApps.map((a) =>
            a.id === appId ? { ...a, ...updates } : a
          ),
        }));
      },
    }),
    {
      name: 'ai-os-apps',
      version: 1,
      partialize: (state) => ({
        pinnedApps: state.pinnedApps,
        recentApps: state.recentApps,
      }),
    }
  )
);