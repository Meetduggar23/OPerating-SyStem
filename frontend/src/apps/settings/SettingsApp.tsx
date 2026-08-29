import { useState } from 'react';
import { Settings, Palette, Shield, Cpu, Database, Monitor, Bot, Moon, Sun, Check } from 'lucide-react';
import { cn } from '@shared/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { APP_NAME, APP_VERSION, APP_BUILD } from '@shared/constants';

interface SettingsAppProps {
  windowId: string;
}

type SettingsSection = 'appearance' | 'system' | 'privacy' | 'ai' | 'storage';

const SECTIONS: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'storage', label: 'Storage', icon: Database },
];

const ACCENT_COLORS = ['#AD8B73', '#CEAB93', '#E3CAA5', '#27AE60', '#C0392B', '#F39C12', '#9B59B6', '#3498DB'];

export function SettingsApp({ windowId }: SettingsAppProps) {
  const { settings, updateAppearance, updateSettings } = useSettingsStore();
  const { addNotification } = useNotificationStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateAppearance({ theme });
    addNotification({ type: 'success', title: 'Theme updated', message: `Theme changed to ${theme}`, duration: 2000 });
  };

  const handleAccentColorChange = (color: string) => {
    updateAppearance({ accentColor: color });
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Theme</h3>
              <div className="flex gap-3">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button key={theme} className={cn('flex items-center gap-2 px-4 py-3 rounded-xl border transition-all', settings.appearance.theme === theme ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-border-dark')} onClick={() => handleThemeChange(theme)}>
                    {theme === 'light' ? <Sun className="w-5 h-5" /> : theme === 'dark' ? <Moon className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    <span className="text-sm font-medium capitalize">{theme}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Accent Color</h3>
              <div className="flex gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button key={color} className={cn('w-8 h-8 rounded-full transition-transform', settings.appearance.accentColor === color && 'ring-2 ring-offset-2 ring-primary scale-110')} style={{ backgroundColor: color }} onClick={() => handleAccentColorChange(color)} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Animations</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.appearance.animationsEnabled} onChange={(e) => updateAppearance({ animationsEnabled: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm text-text">Enable animations</span>
              </label>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Reduced Motion</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.appearance.reducedMotion} onChange={(e) => updateAppearance({ reducedMotion: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm text-text">Reduce motion for accessibility</span>
              </label>
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">System</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.system.autoStart} onChange={(e) => updateSettings({ system: { ...settings.system, autoStart: e.target.checked } })} className="w-4 h-4 rounded" />
                  <span className="text-sm text-text">Start on system startup</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.system.minimizeToTray} onChange={(e) => updateSettings({ system: { ...settings.system, minimizeToTray: e.target.checked } })} className="w-4 h-4 rounded" />
                  <span className="text-sm text-text">Minimize to system tray</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.system.showBootScreen} onChange={(e) => updateSettings({ system: { ...settings.system, showBootScreen: e.target.checked } })} className="w-4 h-4 rounded" />
                  <span className="text-sm text-text">Show boot screen</span>
                </label>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">About</h3>
              <div className="p-4 bg-surface border border-border rounded-xl space-y-2">
                <div className="flex justify-between text-sm"><span className="text-text-muted">Name</span><span className="text-text">{APP_NAME}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Version</span><span className="text-text">{APP_VERSION}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Build</span><span className="text-text">{APP_BUILD}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Platform</span><span className="text-text">{navigator.platform}</span></div>
              </div>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">AI Permissions</h3>
              <div className="space-y-3">
                {Object.entries(settings.privacy.aiPermissions).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={value} onChange={(e) => updateSettings({ privacy: { ...settings.privacy, aiPermissions: { ...settings.privacy.aiPermissions, [key]: e.target.checked } } })} className="w-4 h-4 rounded" />
                    <span className="text-sm text-text capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">General</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.privacy.fileAccess} onChange={(e) => updateSettings({ privacy: { ...settings.privacy, fileAccess: e.target.checked } })} className="w-4 h-4 rounded" />
                  <span className="text-sm text-text">File access</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.privacy.activityTracking} onChange={(e) => updateSettings({ privacy: { ...settings.privacy, activityTracking: e.target.checked } })} className="w-4 h-4 rounded" />
                  <span className="text-sm text-text">Activity tracking</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.privacy.telemetry} onChange={(e) => updateSettings({ privacy: { ...settings.privacy, telemetry: e.target.checked } })} className="w-4 h-4 rounded" />
                  <span className="text-sm text-text">Telemetry</span>
                </label>
              </div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Ollama Connection</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.ai.ollamaEnabled} onChange={(e) => updateSettings({ ai: { ...settings.ai, ollamaEnabled: e.target.checked } })} className="w-4 h-4 rounded" />
                  <span className="text-sm text-text">Enable Ollama</span>
                </label>
                <div><label className="label">Host</label><input type="text" value={settings.ai.ollamaHost} onChange={(e) => updateSettings({ ai: { ...settings.ai, ollamaHost: e.target.value }})} className="input" placeholder="http://localhost:11434" /></div>
                <div><label className="label">Default Model</label><input type="text" value={settings.ai.defaultModel} onChange={(e) => updateSettings({ ai: { ...settings.ai, defaultModel: e.target.value }})} className="input" placeholder="llama3" /></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Generation</h3>
              <div className="space-y-3">
                <div><label className="label">Temperature ({settings.ai.temperature})</label><input type="range" min="0" max="2" step="0.1" value={settings.ai.temperature} onChange={(e) => updateSettings({ ai: { ...settings.ai, temperature: parseFloat(e.target.value) }})} className="w-full" /></div>
                <div><label className="label">Max Tokens</label><input type="number" value={settings.ai.maxTokens} onChange={(e) => updateSettings({ ai: { ...settings.ai, maxTokens: parseInt(e.target.value) || 2048 }})} className="input" min="256" max="8192" /></div>
              </div>
            </div>
          </div>
        );
      case 'storage':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Storage</h3>
              <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
                <div className="flex justify-between text-sm"><span className="text-text-muted">Database</span><span className="text-text">SQLite</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Max Storage</span><span className="text-text">{(settings.storage.maxStorage / 1024 / 1024 / 1024).toFixed(1)} GB</span></div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.storage.autoVacuum} onChange={(e) => updateSettings({ storage: { ...settings.storage, autoVacuum: e.target.checked } })} className="w-4 h-4 rounded" />
                  <span className="text-sm text-text">Auto vacuum database</span>
                </label>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Local Storage</h3>
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="flex justify-between text-sm mb-2"><span className="text-text-muted">Notes</span><span className="text-text">{(JSON.parse(localStorage.getItem('ai-os-notes') || '[]').length * 0.5).toFixed(1)} KB</span></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-text-muted">Tasks</span><span className="text-text">{(JSON.parse(localStorage.getItem('ai-os-tasks') || '[]').length * 0.3).toFixed(1)} KB</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Settings</span><span className="text-text">{(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB</span></div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full bg-surface">
      <div className="w-56 border-r border-border bg-surface-hover p-3">
        <nav className="space-y-0.5">
          {SECTIONS.map((section) => (
            <button key={section.id} className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors', activeSection === section.id ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface-hover')} onClick={() => setActiveSection(section.id)}>
              <section.icon className="w-4 h-4" />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-xl font-semibold text-text mb-6">{SECTIONS.find((s) => s.id === activeSection)?.label}</h2>
        {renderSection()}
      </div>
    </div>
  );
}