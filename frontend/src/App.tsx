import { Desktop } from '@/components/desktop/Desktop';
import { WindowProvider } from '@/components/windows/WindowProvider';
import { Taskbar } from '@/components/taskbar/Taskbar';
import { NotificationContainer } from '@/components/notifications/NotificationContainer';
import { ContextMenuProvider } from '@/components/common/ContextMenu';
import { BootScreen } from '@/components/desktop/BootScreen';
import { useBootStore } from '@/stores/bootStore';
import { useSettingsStore } from '@/stores/settingsStore';

function AppContent() {
  const { isBooted } = useBootStore();
  const { settings } = useSettingsStore();
  const theme = settings.appearance.theme;

  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  if (!isBooted) {
    return <BootScreen />;
  }

  return (
    <div className={`fixed inset-0 ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <WindowProvider>
        <Desktop />
        <Taskbar />
        <NotificationContainer />
      </WindowProvider>
      <ContextMenuProvider>
        <div />
      </ContextMenuProvider>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;