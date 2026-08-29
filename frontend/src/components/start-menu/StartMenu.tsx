import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Power, Settings, Moon, Sun, RefreshCw, X, Clock, Grid, Download, Lock, Pin } from 'lucide-react';
import { cn } from '@shared/utils';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWindowStore } from '@/stores/windowStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ContextMenu } from '@/components/common/ContextMenu';
import { TASKBAR_HEIGHT } from '@shared/constants';
import type { AppMetadata, AppCategory } from '@shared/types';

const CATEGORIES: { id: AppCategory | 'all' | 'pinned' | 'recent'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'pinned', label: 'Pinned', icon: Pin },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'system', label: 'System', icon: Settings },
  { id: 'productivity', label: 'Productivity', icon: Settings },
  { id: 'utilities', label: 'Utilities', icon: Settings },
  { id: 'ai', label: 'AI', icon: Settings },
  { id: 'all', label: 'All Applications', icon: Grid },
];

const PINNED_APPS = ['file-manager', 'terminal', 'notes', 'settings'];

const APP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'file-manager': () => null,
  terminal: () => null,
  notes: () => null,
  calculator: () => null,
  calendar: () => null,
  'task-manager': () => null,
  'app-store': () => null,
  settings: () => null,
  'ai-assistant': () => null,
  'system-monitor': () => null,
  about: () => null,
};

import { Folder, Terminal as TerminalIcon, FileText, Calculator, Calendar, CheckSquare, Store, Bot, Activity, Info } from 'lucide-react';

const APP_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'file-manager': Folder,
  terminal: TerminalIcon,
  notes: FileText,
  calculator: Calculator,
  calendar: Calendar,
  'task-manager': CheckSquare,
  'app-store': Store,
  settings: Settings,
  'ai-assistant': Bot,
  'system-monitor': Activity,
  about: Info,
};

export function StartMenu({ onClose }: { onClose: () => void }) {
  const { apps, getPinnedApps, getRecentApps, searchApps, launchApp, pinApp, unpinApp } = useAppStore();
  const { settings } = useSettingsStore();
  const { toggleTheme } = useSettingsStore();
  const { openWindow, getWindowsByApp } = useWindowStore();
  const { addNotification } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('pinned');
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredApps = searchQuery
    ? searchApps(searchQuery)
    : activeCategory === 'pinned'
    ? getPinnedApps()
    : activeCategory === 'all'
    ? apps.filter((a) => a.installed)
    : activeCategory === 'recent'
    ? getRecentApps()
    : apps.filter((a) => a.installed && a.category === activeCategory);

  const recentApps = getRecentApps().slice(0, 5);

  const handleAppClick = useCallback((app: AppMetadata) => {
    if (!app.installed) return;
    launchApp(app.id);
    const existingWindows = getWindowsByApp(app.id);
    if (existingWindows.length > 0) {
      const window = existingWindows[0];
      if (window.isMinimized) useWindowStore.getState().restoreWindow(window.id);
      useWindowStore.getState().focusWindow(window.id);
    } else {
      openWindow(app);
    }
    onClose();
  }, [launchApp, getWindowsByApp, openWindow, onClose]);

  const handlePinClick = useCallback((app: AppMetadata, e: React.MouseEvent) => {
    e.stopPropagation();
    const pinned = useAppStore.getState().pinnedApps;
    if (pinned.includes(app.id)) {
      unpinApp(app.id);
    } else {
      pinApp(app.id);
    }
  }, [pinApp, unpinApp]);

  const handlePowerAction = useCallback((action: string) => {
    const messages: Record<string, string> = {
      shutdown: 'Shutting down...', restart: 'Restarting...', lock: 'Locking...', sleep: 'Sleeping...',
    };
    addNotification({ type: 'warning', title: 'Power', message: messages[action] || 'Action performed' });
    onClose();
  }, [addNotification, onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bottom-0 left-4 z-[60] animate-in"
      style={{ width: 380, maxHeight: 520 }}
      role="menu"
      aria-label="Start menu"
    >
      <div className="bg-surface border border-border rounded-xl shadow-window overflow-hidden flex flex-col">
        <div className="flex h-full">
          <div className="flex flex-col w-64 border-r border-border bg-surface-hover p-4 gap-4">
            <div className="flex items-center gap-3 px-2">
              <img src="/logo.png" alt="" className="w-10 h-10 rounded-xl" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">AI Operating System</p>
                <p className="text-xs text-text-muted">v1.0.0</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setActiveCategory('all'); }}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1" role="navigation" aria-label="App categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    activeCategory === cat.id && 'bg-primary/15 text-primary',
                    'hover:bg-surface-hover'
                  )}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <cat.icon className="w-5 h-5" />
                  <span>{cat.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <button
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-hover"
                onClick={() => toggleTheme({ theme: settings.appearance.theme === 'dark' ? 'light' : 'dark' })}
              >
                {settings.appearance.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{settings.appearance.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-hover" onClick={() => setShowPowerMenu(true)}>
                <Power className="w-5 h-5 text-danger" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {searchQuery && (
              <div className="px-4 py-3 border-b border-border bg-surface-hover">
                <p className="text-sm text-text-muted">{filteredApps.length} result{filteredApps.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}

            {activeCategory === 'recent' && recentApps.length > 0 && !searchQuery && (
              <div className="px-4 py-3 border-b border-border bg-surface-hover">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Recent</p>
                <div className="flex flex-wrap gap-2">
                  {recentApps.map((app) => (
                    <button key={app.id} className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-sm hover:bg-surface-hover transition-colors" onClick={() => handleAppClick(app)}>
                      <span className="truncate max-w-[150px]">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {filteredApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted">
                  <Search className="w-12 h-12 opacity-30 mb-4" />
                  <p className="text-sm">No applications found</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3" role="list" aria-label="Applications">
                  {filteredApps.map((app) => (
                    <AppTile key={app.id} app={app} onClick={handleAppClick} onPinClick={handlePinClick} isPinned={PINNED_APPS.includes(app.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPowerMenu && (
        <ContextMenu
          isOpen={true}
          onClose={() => setShowPowerMenu(false)}
          x={16}
          y={window.innerHeight - TASKBAR_HEIGHT - 200}
          items={[
            { label: 'Lock', icon: Lock, onClick: () => handlePowerAction('lock') },
            { label: 'Sleep', icon: Moon, onClick: () => handlePowerAction('sleep') },
            { type: 'separator' },
            { label: 'Restart', icon: RefreshCw, onClick: () => handlePowerAction('restart') },
            { label: 'Shut Down', icon: Power, variant: 'danger', onClick: () => handlePowerAction('shutdown') },
          ]}
        />
      )}
    </div>
  );
}

function AppTile({ app, onClick, onPinClick, isPinned }: { app: AppMetadata; onClick: (app: AppMetadata) => void; onPinClick: (app: AppMetadata, e: React.MouseEvent) => void; isPinned: boolean }) {
  const IconComponent = APP_ICON_MAP[app.id] || Folder;
  return (
    <button
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-150',
        'bg-surface border border-border',
        'hover:bg-surface-hover hover:border-border-dark hover:shadow-md',
        'active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        app.installed ? '' : 'opacity-60'
      )}
      onClick={() => onClick(app)}
      onContextMenu={(e) => onPinClick(app, e)}
      role="listitem"
      aria-label={app.name}
    >
      <div className="relative">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-surface-active border border-border">
          <IconComponent className="w-6 h-6 text-text" />
        </div>
        {!app.installed && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-[10px] flex items-center justify-center text-text-inverse">
            <Download className="w-3 h-3" />
          </span>
        )}
      </div>
      <span className="text-xs text-text truncate text-center w-full px-1">{app.name}</span>
      {isPinned && (
        <Pin className="absolute -top-1 -right-1 w-4 h-4 text-primary" />
      )}
    </button>
  );
}