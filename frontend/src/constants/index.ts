export const APP_NAME = 'AI Operating System';
export const APP_VERSION = '1.0.0';
export const APP_BUILD = '2026.08.30';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const DEFAULT_WINDOW_WIDTH = 900;
export const DEFAULT_WINDOW_HEIGHT = 600;
export const MIN_WINDOW_WIDTH = 400;
export const MIN_WINDOW_HEIGHT = 300;

export const DESKTOP_ICON_SIZE = 80;
export const DESKTOP_ICON_SPACING = 16;
export const DESKTOP_GRID_SIZE = 96;

export const TASKBAR_HEIGHT = 48;
export const START_MENU_WIDTH = 380;
export const START_MENU_HEIGHT = 520;

export const NOTIFICATION_DURATION = 5000;
export const MAX_NOTIFICATIONS = 5;

export const SEARCH_DEBOUNCE_MS = 150;
export const SEARCH_MAX_RESULTS = 20;

export const AI_MAX_CONVERSATIONS = 50;
export const AI_MAX_MESSAGES_PER_CONVERSATION = 100;
export const AI_DEFAULT_TEMPERATURE = 0.7;
export const AI_DEFAULT_MAX_TOKENS = 2048;

export const DB_NAME = 'ai-os.db';
export const DB_VERSION = 1;

export const STORAGE_KEYS = {
  SETTINGS: 'ai-os-settings',
  WINDOW_STATES: 'ai-os-window-states',
  DESKTOP_ICONS: 'ai-os-desktop-icons',
  RECENT_FILES: 'ai-os-recent-files',
  RECENT_APPS: 'ai-os-recent-apps',
  KEYBOARD_SHORTCUTS: 'ai-os-keyboard-shortcuts',
} as const;

export const IPC_CHANNELS = {
  FS_READ: 'fs:read',
  FS_WRITE: 'fs:write',
  FS_DELETE: 'fs:delete',
  FS_MKDIR: 'fs:mkdir',
  FS_READ_DIR: 'fs:readdir',
  FS_STAT: 'fs:stat',
  FS_COPY: 'fs:copy',
  FS_RENAME: 'fs:rename',
  FS_EXISTS: 'fs:exists',
  FS_HOME_DIR: 'fs:home-dir',
  FS_DESKTOP_DIR: 'fs:desktop-dir',
  FS_DOCUMENTS_DIR: 'fs:documents-dir',
  FS_DOWNLOADS_DIR: 'fs:downloads-dir',
  TERMINAL_EXEC: 'terminal:exec',
  TERMINAL_SHELL: 'terminal:shell',
  DB_QUERY: 'db:query',
  DB_EXECUTE: 'db:execute',
  DB_MIGRATE: 'db:migrate',
  DB_SEED: 'db:seed',
  SYSTEM_INFO: 'system:info',
  SYSTEM_PROCESSES: 'system:processes',
  SYSTEM_CPU: 'system:cpu',
  SYSTEM_MEMORY: 'system:memory',
  SYSTEM_DISK: 'system:disk',
  SYSTEM_RESTART: 'system:restart',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  SYSTEM_OPEN_EXTERNAL: 'system:open-external',
  AI_CHECK_OLLAMA: 'ai:check-ollama',
  AI_CHAT: 'ai:chat',
  AI_STREAM_CHAT: 'ai:stream-chat',
  APP_VERSION: 'app:version',
  APP_PATH: 'app:path',
  APP_SHOW_IN_FOLDER: 'app:show-in-folder',
  APP_OPEN_PATH: 'app:open-path',
} as const;

export const EVENT_CHANNELS = {
  WINDOW_OPEN: 'window:open',
  WINDOW_CLOSE: 'window:close',
  WINDOW_FOCUS: 'window:focus',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_MOVE: 'window:move',
  WINDOW_RESIZE: 'window:resize',
  APP_LAUNCH: 'app:launch',
  APP_INSTALL: 'app:install',
  APP_UNINSTALL: 'app:uninstall',
  FILE_CREATE: 'file:create',
  FILE_DELETE: 'file:delete',
  FILE_MOVE: 'file:move',
  FILE_COPY: 'file:copy',
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_HIDE: 'notification:hide',
  SETTINGS_CHANGE: 'settings:change',
  THEME_CHANGE: 'theme:change',
  AI_RESPONSE: 'ai:response',
  SEARCH_QUERY: 'search:query',
  BOOT_COMPLETE: 'boot:complete',
} as const;

export const KEYBOARD_SHORTCUTS = [
  { id: 'global-search', keys: ['Meta', 'K'], description: 'Open global search', action: 'global-search', global: true },
  { id: 'terminal', keys: ['Meta', 'Shift', 'T'], description: 'Open terminal', action: 'open-terminal', global: true },
  { id: 'new-window', keys: ['Meta', 'N'], description: 'New window/item', action: 'new-item', global: false },
  { id: 'switch-app', keys: ['Alt', 'Tab'], description: 'Switch applications', action: 'switch-app', global: true },
  { id: 'close-menu', keys: ['Escape'], description: 'Close menus/dialogs', action: 'close-menu', global: true },
  { id: 'save', keys: ['Meta', 'S'], description: 'Save current item', action: 'save', global: false },
  { id: 'refresh', keys: ['Meta', 'R'], description: 'Refresh current view', action: 'refresh', global: false },
  { id: 'settings', keys: ['Meta', ','], description: 'Open settings', action: 'open-settings', global: true },
  { id: 'task-manager', keys: ['Meta', 'Shift', 'Escape'], description: 'Open system monitor', action: 'open-system-monitor', global: true },
  { id: 'screenshot', keys: ['Meta', 'Shift', '4'], description: 'Take screenshot', action: 'screenshot', global: true },
] as const;

export const FILE_ICONS: Record<string, string> = {
  default: 'file',
  folder: 'folder',
  'txt': 'file-text',
  'md': 'file-text',
  'json': 'file-json',
  'js': 'file-code',
  'ts': 'file-code',
  'tsx': 'file-code',
  'jsx': 'file-code',
  'html': 'file-code',
  'css': 'file-code',
  'scss': 'file-code',
  'png': 'file-image',
  'jpg': 'file-image',
  'jpeg': 'file-image',
  'gif': 'file-image',
  'svg': 'file-image',
  'webp': 'file-image',
  'mp4': 'file-video',
  'mov': 'file-video',
  'avi': 'file-video',
  'mp3': 'file-audio',
  'wav': 'file-audio',
  'pdf': 'file-pdf',
  'zip': 'file-archive',
  'tar': 'file-archive',
  'gz': 'file-archive',
  'exe': 'file-code',
  'dmg': 'file-code',
  'app': 'file-code',
  'db': 'database',
  'sql': 'database',
  'sqlite': 'database',
};

export const MIME_TYPES: Record<string, string> = {
  'txt': 'text/plain',
  'md': 'text/markdown',
  'json': 'application/json',
  'js': 'application/javascript',
  'ts': 'application/typescript',
  'html': 'text/html',
  'css': 'text/css',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'webp': 'image/webp',
  'mp4': 'video/mp4',
  'mp3': 'audio/mpeg',
  'pdf': 'application/pdf',
  'zip': 'application/zip',
};