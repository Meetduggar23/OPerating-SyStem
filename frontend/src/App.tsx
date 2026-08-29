import { Desktop } from '@/components/desktop/Desktop';
import { WindowProvider } from '@/components/windows/WindowProvider';
import { Taskbar } from '@/components/taskbar/Taskbar';
import { StartMenu } from '@/components/start-menu/StartMenu';
import { NotificationContainer } from '@/components/notifications/NotificationContainer';
import { GlobalSearch } from '@/components/widgets/GlobalSearch';
import { ContextMenuProvider } from '@/components/common/ContextMenu';
import { BootScreen } from '@/components/desktop/BootScreen';
import { useBootStore } from '@/stores/bootStore';
import { useSettingsStore } from '@/stores/settingsStore';

function AppContent() {
  const { isBooted } = useBootStore();
  const { theme } = useSettingsStore();

  if (!isBooted) {
    return <BootScreen />;
  }

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'dark' : ''}`}>
      <WindowProvider>
        <Desktop />
        <Taskbar />
        <StartMenu />
        <GlobalSearch />
        <NotificationContainer />
      </WindowProvider>
      <ContextMenuProvider />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;