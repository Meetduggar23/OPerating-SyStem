import { useState, useEffect } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { Window } from './Window';
import type { WindowState } from '@/types';

interface WindowProviderProps {
  children: React.ReactNode;
}

export function WindowProvider({ children }: WindowProviderProps) {
  const windows = useWindowStore((state) => Array.from(state.windows.values()));

  const sortedWindows = [...windows].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="fixed inset-0 pointer-events-none" id="window-layer">
      {sortedWindows.map((windowState) => (
        <WindowWrapper key={windowState.id} windowState={windowState} />
      ))}
      {children}
    </div>
  );
}

function WindowWrapper({ windowState }: { windowState: WindowState }) {
  return (
    <Window
      id={windowState.id}
      title={windowState.title}
      key={windowState.id}
    >
      <div className="flex-1 overflow-hidden">
        <WindowContent appId={windowState.appId} windowId={windowState.id} />
      </div>
    </Window>
  );
}

function WindowContent({ appId, windowId }: { appId: string; windowId: string }) {
  return (
    <div className="h-full w-full">
      <AppRenderer appId={appId} windowId={windowId} />
    </div>
  );
}

function AppRenderer({ appId, windowId }: { appId: string; windowId: string }) {
  const renderApp = () => {
    switch (appId) {
      case 'file-manager':
        return import('@/apps/file-manager/FileManagerApp').then((m) => m.FileManagerApp);
      case 'terminal':
        return import('@/apps/terminal/TerminalApp').then((m) => m.TerminalApp);
      case 'notes':
        return import('@/apps/notes/NotesApp').then((m) => m.NotesApp);
      case 'calculator':
        return import('@/apps/calculator/CalculatorApp').then((m) => m.CalculatorApp);
      case 'calendar':
        return import('@/apps/calendar/CalendarApp').then((m) => m.CalendarApp);
      case 'task-manager':
        return import('@/apps/task-manager/TaskManagerApp').then((m) => m.TaskManagerApp);
      case 'app-store':
        return import('@/apps/app-store/AppStoreApp').then((m) => m.AppStoreApp);
      case 'settings':
        return import('@/apps/settings/SettingsApp').then((m) => m.SettingsApp);
      case 'ai-assistant':
        return import('@/apps/ai-assistant/AIAssistantApp').then((m) => m.AIAssistantApp);
      case 'system-monitor':
        return import('@/apps/system-monitor/SystemMonitorApp').then((m) => m.SystemMonitorApp);
      case 'about':
        return import('@/apps/about/AboutApp').then((m) => m.AboutApp);
      default:
        return Promise.resolve(() => <div className="p-8 text-center text-text-muted">Unknown application: {appId}</div>);
    }
  };

  const [AppComponent, setAppComponent] = useState<React.ComponentType<{ windowId: string }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    renderApp()
      .then((Component) => {
        setAppComponent(() => Component as React.ComponentType<{ windowId: string }>);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [appId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <p className="text-danger font-medium">Failed to load application</p>
          <p className="text-sm text-text-muted mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!AppComponent) {
    return <div className="flex h-full items-center justify-center text-text-muted">Application not found</div>;
  }

  return <AppComponent windowId={windowId} />;
}