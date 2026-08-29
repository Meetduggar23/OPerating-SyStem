import { useState } from 'react';
import { Search, Download, Check, ExternalLink, Star, Clock, Users, Tag } from 'lucide-react';
import { cn } from '@shared/utils';
import { useAppStore } from '@/stores/appStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { AppMetadata, AppCategory } from '@shared/types';

interface AppStoreAppProps {
  windowId: string;
}

const CATEGORIES: { id: AppCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'development', label: 'Development' },
  { id: 'media', label: 'Media' },
  { id: 'ai', label: 'AI' },
];

export function AppStoreApp({ windowId }: AppStoreAppProps) {
  const { apps, installApp, uninstallApp } = useAppStore();
  const { addNotification } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all');
  const [selectedApp, setSelectedApp] = useState<AppMetadata | null>(null);
  const [installing, setInstalling] = useState<Set<string>>(new Set());

  const filteredApps = apps.filter((app) => {
    if (selectedCategory !== 'all' && app.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleInstall = async (app: AppMetadata) => {
    setInstalling((prev) => new Set(prev).add(app.id));
    await new Promise((r) => setTimeout(r, 1000));
    const success = await installApp(app.id);
    setInstalling((prev) => { const next = new Set(prev); next.delete(app.id); return next; });
    if (success) addNotification({ type: 'success', title: 'Installed', message: `${app.name} has been installed` });
  };

  const handleUninstall = async (app: AppMetadata) => {
    const success = await uninstallApp(app.id);
    if (success) addNotification({ type: 'info', title: 'Uninstalled', message: `${app.name} has been uninstalled` });
    setSelectedApp(null);
  };

  return (
    <div className="flex h-full bg-surface">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Search apps..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-9" />
          </div>
          <div className="flex gap-1 bg-surface-active border border-border rounded-lg p-0.5">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', selectedCategory === cat.id ? 'bg-primary text-text-inverse' : 'text-text-muted hover:bg-surface-hover')} onClick={() => setSelectedCategory(cat.id)}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map((app) => (
              <div key={app.id} className={cn('p-4 bg-surface border border-border rounded-xl hover:shadow-md transition-all cursor-pointer', selectedApp?.id === app.id && 'ring-2 ring-primary')} onClick={() => setSelectedApp(app)}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-active border border-border flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{app.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text truncate">{app.name}</h3>
                      {app.installed && <span className="text-[10px] px-1.5 py-0.5 bg-success/15 text-success rounded-full">Installed</span>}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{app.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                      <span>v{app.version}</span>
                      <span>{app.size}</span>
                      <span className="capitalize">{app.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  {app.installed ? (
                    app.category !== 'system' ? (
                      <button className="btn-secondary text-xs py-1 px-3" onClick={(e) => { e.stopPropagation(); handleUninstall(app); }}>Uninstall</button>
                    ) : (
                      <span className="text-xs text-text-muted">System App</span>
                    )
                  ) : (
                    <button className="btn-primary text-xs py-1 px-3" disabled={installing.has(app.id)} onClick={(e) => { e.stopPropagation(); handleInstall(app); }}>
                      {installing.has(app.id) ? 'Installing...' : 'Install'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedApp && (
        <div className="w-80 border-l border-border bg-surface-hover p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-xl bg-surface-active border border-border flex items-center justify-center">
              <span className="text-3xl">{selectedApp.icon}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">{selectedApp.name}</h2>
              <p className="text-sm text-text-muted">{selectedApp.developer}</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-4">{selectedApp.description}</p>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm"><span className="text-text-muted">Version</span><span className="text-text">{selectedApp.version}</span></div>
            <div className="flex justify-between text-sm"><span className="text-text-muted">Size</span><span className="text-text">{selectedApp.size}</span></div>
            <div className="flex justify-between text-sm"><span className="text-text-muted">Category</span><span className="text-text capitalize">{selectedApp.category}</span></div>
          </div>
          {selectedApp.installed ? (
            selectedApp.category !== 'system' && (
              <button className="btn-danger w-full" onClick={() => handleUninstall(selectedApp)}>Uninstall</button>
            )
          ) : (
            <button className="btn-primary w-full" disabled={installing.has(selectedApp.id)} onClick={() => handleInstall(selectedApp)}>
              {installing.has(selectedApp.id) ? 'Installing...' : 'Install'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}