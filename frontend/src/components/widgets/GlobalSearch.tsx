import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Folder, FileText, Terminal, CheckSquare, Calendar, Bot, AppWindow, Settings } from 'lucide-react';
import { cn, formatRelativeTime } from '@shared/utils';
import { useAppStore } from '@/stores/appStore';
import { useWindowStore } from '@/stores/windowStore';
import { useNotificationStore } from '@/stores/notificationStore';

const CATEGORY_ICONS = {
  apps: AppWindow,
  files: Folder,
  notes: FileText,
  tasks: CheckSquare,
  events: Calendar,
  ai: Bot,
};

const CATEGORY_LABELS = {
  apps: 'Applications',
  files: 'Files',
  notes: 'Notes',
  tasks: 'Tasks',
  events: 'Calendar',
  ai: 'AI Conversations',
};

interface SearchResult {
  type: 'app' | 'file' | 'note' | 'task' | 'event' | 'ai';
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  data: unknown;
}

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const { searchApps } = useAppStore();
  const { openWindow, getWindowsByApp } = useWindowStore();
  const { addNotification } = useNotificationStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const debouncedSearch = setTimeout(() => {
      performSearch(query);
    }, 100);

    return () => clearTimeout(debouncedSearch);
  }, [query]);

  const performSearch = (searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase();
    const allResults: SearchResult[] = [];

    const apps = searchApps(searchQuery);
    allResults.push(...apps.map((app) => ({
      type: 'app' as const,
      id: app.id,
      title: app.name,
      subtitle: app.description,
      icon: app.icon,
      data: app,
    })));

    setResults(allResults.slice(0, 20));
    setSelectedIndex(0);
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'app': {
        const app = result.data as { id: string; name: string; icon: string };
        const existingWindows = getWindowsByApp(app.id);
        if (existingWindows.length > 0) {
          const window = existingWindows[0];
          if (window.isMinimized) useWindowStore.getState().restoreWindow(window.id);
          useWindowStore.getState().focusWindow(window.id);
        } else {
          useAppStore.getState().launchApp(app.id);
          openWindow(app);
        }
        break;
      }
    }
    onClose();
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div
      ref={containerRef}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[800] w-full max-w-2xl animate-in pointer-events-auto"
      role="dialog"
      aria-label="Global search"
    >
      <div className="bg-surface border border-border rounded-xl shadow-window overflow-hidden">
        <div className="relative p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
              placeholder="Search applications, files, notes..."
              className="w-full pl-12 pr-12 py-3 bg-surface-active border border-border rounded-lg text-lg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              autoComplete="off"
            />
            {query && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/5 transition-colors text-text-muted"
                onClick={handleClear}
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto border-t border-border">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-text-muted">
              <Search className="w-12 h-12 mx-auto opacity-30 mb-4" />
              <p className="text-lg font-medium text-text mb-1">Search your system</p>
              <p className="text-sm">Type to find applications, files, notes, and more</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-text-muted">
                <kbd className="px-2 py-1 bg-surface-active border border-border rounded">⌘K</kbd>
                <span>Open search</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <Search className="w-12 h-12 mx-auto opacity-30 mb-4" />
              <p className="text-lg font-medium text-text mb-1">No results found</p>
              <p className="text-sm">No matches for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="mb-4">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-muted uppercase tracking-wide">
                    <CATEGORY_ICONS[type as keyof typeof CATEGORY_ICONS]?.className="w-4 h-4" />
                    {CATEGORY_LABELS[type as keyof typeof CATEGORY_LABELS] || type}
                    <span className="ml-auto px-2 py-0.5 bg-surface-active border border-border rounded-full text-[11px]">
                      {items.length}
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((result, index) => {
                      const globalIndex = results.indexOf(result);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <button
                          key={result.id}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                            'hover:bg-surface-hover',
                            isSelected && 'bg-primary/15 text-primary'
                          )}
                          onClick={() => handleResultClick(result)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        >
                          <div className={cn(
                            'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
                            isSelected ? 'bg-primary/20' : 'bg-surface-active border border-border'
                          )}>
                            {result.icon && (
                              <span className="text-lg">{result.icon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('font-medium truncate', isSelected ? 'text-text' : 'text-text')}>
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className={cn('text-sm truncate', isSelected ? 'text-text-secondary' : 'text-text-muted')}>
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-text-muted uppercase tracking-wide flex-shrink-0 px-2 py-0.5 bg-surface-active border border-border rounded">
                            {type}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}