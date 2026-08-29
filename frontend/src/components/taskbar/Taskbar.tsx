import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Search, Wifi, Volume2, Battery, Bell, ChevronUp, Moon, Sun, Power, Settings, Monitor } from 'lucide-react';
import { cn, formatTime } from '@/utils';
import { useWindowStore } from '@/stores/windowStore';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore, useTheme } from '@/stores/settingsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { StartMenu } from '@/components/start-menu/StartMenu';
import { GlobalSearch } from '@/components/widgets/GlobalSearch';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { ContextMenu } from '@/components/common/ContextMenu';
import { TASKBAR_HEIGHT } from '@/constants';

const PINNED_APPS = ['file-manager', 'terminal', 'notes', 'settings'];

import { Folder, Terminal as TerminalIcon, FileText } from 'lucide-react';

const APP_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'file-manager': Folder,
  terminal: TerminalIcon,
  notes: FileText,
  settings: Settings,
};

export function Taskbar() {
  const { windows, focusWindow, getWindowsByApp } = useWindowStore();
  const { getApp, launchApp } = useAppStore();
  const { notifications } = useNotificationStore();
  const { openWindow } = useWindowStore();

  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [systemTrayOpen, setSystemTrayOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  const taskbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (taskbarRef.current && !taskbarRef.current.contains(e.target as Node)) {
        setStartMenuOpen(false);
        setSearchOpen(false);
        setNotificationPanelOpen(false);
        setSystemTrayOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runningApps = Array.from(new Set(
    Array.from(windows.values())
      .filter((w) => !w.isMinimized)
      .map((w) => w.appId)
  ));

  const allPinnedApps = [...new Set([...PINNED_APPS, ...runningApps])];

  const handleAppClick = useCallback((appId: string) => {
    const app = getApp(appId);
    if (!app) return;

    const appWindows = getWindowsByApp(appId);
    if (appWindows.length > 0) {
      const window = appWindows[0];
      if (window.isMinimized) {
        useWindowStore.getState().restoreWindow(window.id);
      }
      focusWindow(window.id);
    } else {
      launchApp(appId);
      openWindow(app);
    }

    setStartMenuOpen(false);
  }, [getApp, getWindowsByApp, focusWindow, launchApp, openWindow]);

  const toggleStartMenu = useCallback(() => {
    setStartMenuOpen((prev) => !prev);
    setSearchOpen(false);
    setNotificationPanelOpen(false);
    setSystemTrayOpen(false);
  }, []);

  const handleNotificationClick = useCallback(() => {
    setNotificationPanelOpen((prev) => !prev);
    setStartMenuOpen(false);
    setSearchOpen(false);
    setSystemTrayOpen(false);
  }, []);

  const handleSystemTrayClick = useCallback(() => {
    setSystemTrayOpen((prev) => !prev);
    setStartMenuOpen(false);
    setSearchOpen(false);
    setNotificationPanelOpen(false);
  }, []);

  return (
    <div
      ref={taskbarRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[50]',
        'bg-surface/80 backdrop-blur-md border-t border-border',
        'flex items-center h-[48px] px-2 gap-2'
      )}
      style={{ height: TASKBAR_HEIGHT }}
      role="toolbar"
      aria-label="Taskbar"
    >
      <button
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg',
          'transition-colors duration-150',
          'hover:bg-surface-hover active:bg-surface-active',
          startMenuOpen && 'bg-surface-active'
        )}
        onClick={toggleStartMenu}
        aria-label="Start menu"
        aria-expanded={startMenuOpen}
      >
        <Menu className="w-5 h-5 text-text" />
      </button>

      <div className="flex items-center gap-1 border-l border-r border-border px-2 h-full">
        {allPinnedApps.map((appId) => {
          const app = getApp(appId);
          if (!app) return null;

          const appWindows = getWindowsByApp(appId);
          const isRunning = appWindows.length > 0;
          const isFocused = appWindows.some((w) => w.isFocused);
          const IconComponent = APP_ICON_MAP[appId] || Folder;

          return (
            <button
              key={appId}
              className={cn(
                'relative flex items-center justify-center w-10 h-10 rounded-lg',
                'transition-colors duration-150',
                'hover:bg-surface-hover active:bg-surface-active',
                isFocused && 'bg-primary/20 ring-1 ring-primary',
                isRunning && !isFocused && 'bg-surface-hover'
              )}
              onClick={() => handleAppClick(appId)}
              aria-label={app.name}
              aria-pressed={isFocused}
            >
              <IconComponent className={cn('w-5 h-5', isFocused ? 'text-primary' : 'text-text')} />
              {isRunning && (
                <span className="absolute w-1.5 h-1.5 rounded-full bg-primary -bottom-1 -right-1" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <button
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg',
          'transition-colors duration-150',
          'hover:bg-surface-hover active:bg-surface-active'
        )}
        onClick={() => { setSearchOpen(!searchOpen); setStartMenuOpen(false); setNotificationPanelOpen(false); setSystemTrayOpen(false); }}
        aria-label="Search"
        aria-expanded={searchOpen}
      >
        <Search className="w-5 h-5 text-text-muted" />
      </button>

      <div className="flex items-center gap-1">
        <button
          className={cn(
            'relative flex items-center justify-center w-10 h-10 rounded-lg',
            'transition-colors duration-150',
            'hover:bg-surface-hover active:bg-surface-active',
            notificationPanelOpen && 'bg-surface-active'
          )}
          onClick={handleNotificationClick}
          aria-label={`Notifications (${notifications.length})`}
          aria-expanded={notificationPanelOpen}
        >
          <Bell className={cn('w-5 h-5', notifications.length > 0 ? 'text-primary' : 'text-text-muted')} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-[10px] flex items-center justify-center text-text-inverse">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </button>

        <button
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            'transition-colors duration-150',
            'hover:bg-surface-hover active:bg-surface-active',
            systemTrayOpen && 'bg-surface-active'
          )}
          onClick={handleSystemTrayClick}
          aria-label="System tray"
          aria-expanded={systemTrayOpen}
        >
          <ChevronUp className="w-5 h-5 text-text-muted" />
        </button>

        <div className="flex items-center gap-2 px-2 pl-4 border-l border-border">
          <Wifi className="w-5 h-5 text-text-muted" />
          <Volume2 className="w-5 h-5 text-text-muted" />
          <Battery className="w-5 h-5 text-text-muted" />
        </div>

        <div className="flex flex-col items-end ml-2 mr-2 cursor-pointer" onClick={() => { setStartMenuOpen(false); setSearchOpen(false); setNotificationPanelOpen(false); setSystemTrayOpen(false); }}>
          <span className="text-sm font-medium text-text">{formatTime(time)}</span>
          <span className="text-xs text-text-muted">{time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {startMenuOpen && <StartMenu onClose={() => setStartMenuOpen(false)} />}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      {notificationPanelOpen && (
        <NotificationPanel
          onClose={() => setNotificationPanelOpen(false)}
        />
      )}
      {systemTrayOpen && <SystemTray onClose={() => setSystemTrayOpen(false)} />}
    </div>
  );
}

function SystemTray({ onClose }: { onClose: () => void }) {
  const { settings } = useSettingsStore();
  const { toggleTheme } = useTheme();
  const { addNotification } = useNotificationStore();

  return (
    <ContextMenu
      isOpen={true}
      onClose={onClose}
      x={window.innerWidth - 220}
      y={window.innerHeight - TASKBAR_HEIGHT - 280}
      items={[
        {
          label: settings.appearance.theme === 'dark' ? 'Light Mode' : 'Dark Mode',
          icon: settings.appearance.theme === 'dark' ? Sun : Moon,
          onClick: () => { toggleTheme(); onClose(); },
        },
        { type: 'separator' },
        {
          label: 'Settings',
          icon: Settings,
          onClick: () => { addNotification({ type: 'info', title: 'Settings', message: 'Opening settings...' }); onClose(); },
        },
        {
          label: 'System Monitor',
          icon: Monitor,
          onClick: () => { addNotification({ type: 'info', title: 'System Monitor', message: 'Opening system monitor...' }); onClose(); },
        },
        { type: 'separator' },
        {
          label: 'Restart',
          icon: Power,
          onClick: () => { addNotification({ type: 'warning', title: 'Restart', message: 'Restarting system...' }); onClose(); },
        },
        {
          label: 'Shut Down',
          icon: Power,
          variant: 'danger',
          onClick: () => { addNotification({ type: 'warning', title: 'Shutdown', message: 'Shutting down...' }); onClose(); },
        },
      ]}
    />
  );
}