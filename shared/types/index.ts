export interface AppMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AppCategory;
  version: string;
  developer: string;
  size: string;
  installed: boolean;
  path?: string;
  executable?: string;
  keywords?: string[];
}

export type AppCategory =
  | 'system'
  | 'productivity'
  | 'utilities'
  | 'development'
  | 'media'
  | 'ai'
  | 'settings';

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  zIndex: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  movable?: boolean;
}

export interface DesktopIcon {
  id: string;
  appId: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  order: number;
}

export interface FileSystemEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modifiedTime: number;
  createdTime: number;
  extension?: string;
  mimeType?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: number;
  categoryId?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: number;
  endDate: number;
  allDay: boolean;
  location?: string;
  reminder?: number;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: number;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface SearchResult {
  type: 'app' | 'file' | 'note' | 'task' | 'event';
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  data: unknown;
}

export interface Settings {
  appearance: AppearanceSettings;
  system: SystemSettings;
  applications: ApplicationSettings;
  privacy: PrivacySettings;
  ai: AISettings;
  storage: StorageSettings;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  wallpaper: string;
  animationsEnabled: boolean;
  reducedMotion: boolean;
}

export interface SystemSettings {
  language: string;
  autoStart: boolean;
  minimizeToTray: boolean;
  showBootScreen: boolean;
}

export interface ApplicationSettings {
  defaultApps: Record<string, string>;
  startupApps: string[];
}

export interface PrivacySettings {
  aiPermissions: AIPermissions;
  fileAccess: boolean;
  activityTracking: boolean;
  telemetry: boolean;
}

export interface AIPermissions {
  fileSearch: boolean;
  noteAccess: boolean;
  taskAccess: boolean;
  calendarAccess: boolean;
  appControl: boolean;
  systemInfo: boolean;
}

export interface AISettings {
  ollamaEnabled: boolean;
  ollamaHost: string;
  defaultModel: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface StorageSettings {
  databasePath: string;
  maxStorage: number;
  autoVacuum: boolean;
}

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  action: string;
  global: boolean;
}

export interface SystemStats {
  cpu: number;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  uptime: number;
  processes: number;
}