import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Folder, File, ArrowLeft, ArrowRight, ArrowUp, ChevronRight,
  Search, LayoutGrid, List, Plus, Trash2, Copy, Clipboard,
  FolderPlus, FileText, Edit3, RefreshCw, Home, Download,
  Image, Music, Video, Star, Clock, MoreVertical, X, Check
} from 'lucide-react';
import { cn, formatBytes, formatRelativeTime, getFileExtension } from '@shared/utils';
import { notify } from '@/stores/notificationStore';
import type { FileSystemEntry } from '@shared/types';

interface FileManagerAppProps {
  windowId: string;
}

const SIDEBAR_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, path: '~' },
  { id: 'desktop', label: 'Desktop', icon: Folder, path: '~/Desktop' },
  { id: 'documents', label: 'Documents', icon: FileText, path: '~/Documents' },
  { id: 'downloads', label: 'Downloads', icon: Download, path: '~/Downloads' },
  { id: 'pictures', label: 'Pictures', icon: Image, path: '~/Pictures' },
  { id: 'music', label: 'Music', icon: Music, path: '~/Music' },
  { id: 'videos', label: 'Videos', icon: Video, path: '~/Videos' },
];

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  txt: FileText,
  md: FileText,
  json: FileText,
  js: FileText,
  ts: FileText,
  tsx: FileText,
  jsx: FileText,
  html: FileText,
  css: FileText,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  svg: Image,
  mp3: Music,
  wav: Music,
  mp4: Video,
  mov: Video,
};

function getFileIconComponent(entry: FileSystemEntry) {
  if (entry.isDirectory) return Folder;
  const ext = getFileExtension(entry.name);
  return FILE_ICONS[ext] || File;
}

export function FileManagerApp({ windowId }: FileManagerAppProps) {
  const [currentPath, setCurrentPath] = useState('~');
  const [entries, setEntries] = useState<FileSystemEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified' | 'type'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [history, setHistory] = useState<string[]>(['~']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [clipboard, setClipboard] = useState<{ action: 'copy' | 'cut'; paths: string[] } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry?: FileSystemEntry } | null>(null);

  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.fs.readdir(path);
        if (result.success && result.entries) {
          const fullEntries: FileSystemEntry[] = result.entries.map((e) => ({
            name: e.name,
            path: `${path}/${e.name}`,
            isDirectory: e.isDirectory,
            isFile: e.isFile,
            size: 0,
            modifiedTime: Date.now(),
            createdTime: Date.now(),
            extension: e.name.includes('.') ? e.name.split('.').pop() : undefined,
          }));
          setEntries(fullEntries);
        } else {
          setEntries(getMockEntries(path));
        }
      } else {
        setEntries(getMockEntries(path));
      }
    } catch {
      setEntries(getMockEntries(path));
    }
    setLoading(false);
    setSelected(new Set());
  }, []);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  const getMockEntries = (path: string): FileSystemEntry[] => {
    const dirs = ['Documents', 'Downloads', 'Pictures', 'Music', 'Videos', 'Desktop', '.config'];
    const files = ['readme.txt', 'notes.md', 'config.json', 'package.json', 'tsconfig.json'];
    return [
      ...dirs.map((d) => ({
        name: d, path: `${path}/${d}`, isDirectory: true, isFile: false,
        size: 0, modifiedTime: Date.now() - Math.random() * 86400000 * 30, createdTime: Date.now() - 86400000 * 365,
      })),
      ...files.map((f) => ({
        name: f, path: `${path}/${f}`, isDirectory: false, isFile: true,
        size: Math.floor(Math.random() * 100000), modifiedTime: Date.now() - Math.random() * 86400000 * 30, createdTime: Date.now() - 86400000 * 365,
        extension: f.split('.').pop(),
      })),
    ];
  };

  const navigateTo = useCallback((path: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(path);
  }, [history, historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const goUp = useCallback(() => {
    const parts = currentPath.split('/');
    parts.pop();
    navigateTo(parts.join('/') || '~');
  }, [currentPath, navigateTo]);

  const goHome = useCallback(() => navigateTo('~'), [navigateTo]);

  const handleEntryClick = useCallback((entry: FileSystemEntry, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(entry.path)) next.delete(entry.path);
        else next.add(entry.path);
        return next;
      });
    } else {
      setSelected(new Set([entry.path]));
    }
  }, []);

  const handleEntryDoubleClick = useCallback((entry: FileSystemEntry) => {
    if (entry.isDirectory) {
      navigateTo(entry.path);
    } else {
      notify.info('Open', `Opening ${entry.name}...`);
    }
  }, [navigateTo]);

  const handleContextMenu = useCallback((e: React.MouseEvent, entry?: FileSystemEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  }, []);

  const handleCreateFolder = useCallback(async () => {
    const name = prompt('Folder name:');
    if (!name) return;
    try {
      if (window.electronAPI) {
        await window.electronAPI.fs.mkdir(`${currentPath}/${name}`);
      }
      loadDirectory(currentPath);
      notify.success('Created', `Folder "${name}" created`);
    } catch (err) {
      notify.error('Error', `Failed to create folder: ${err}`);
    }
  }, [currentPath, loadDirectory]);

  const handleCreateFile = useCallback(async () => {
    const name = prompt('File name:');
    if (!name) return;
    try {
      if (window.electronAPI) {
        await window.electronAPI.fs.writeFile(`${currentPath}/${name}`, '');
      }
      loadDirectory(currentPath);
      notify.success('Created', `File "${name}" created`);
    } catch (err) {
      notify.error('Error', `Failed to create file: ${err}`);
    }
  }, [currentPath, loadDirectory]);

  const handleDelete = useCallback(async (paths: string[]) => {
    for (const path of paths) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.fs.deleteFile(path);
        }
      } catch (err) {
        notify.error('Error', `Failed to delete: ${err}`);
      }
    }
    loadDirectory(currentPath);
    notify.success('Deleted', `${paths.length} item(s) deleted`);
  }, [currentPath, loadDirectory]);

  const handleCopy = useCallback(() => {
    if (selected.size > 0) {
      setClipboard({ action: 'copy', paths: Array.from(selected) });
      notify.info('Copied', `${selected.size} item(s) copied to clipboard`);
    }
  }, [selected]);

  const handleCut = useCallback(() => {
    if (selected.size > 0) {
      setClipboard({ action: 'cut', paths: Array.from(selected) });
      notify.info('Cut', `${selected.size} item(s) cut to clipboard`);
    }
  }, [selected]);

  const handlePaste = useCallback(async () => {
    if (!clipboard) return;
    for (const srcPath of clipboard.paths) {
      const fileName = srcPath.split('/').pop() || '';
      const destPath = `${currentPath}/${fileName}`;
      try {
        if (window.electronAPI) {
          if (clipboard.action === 'copy') {
            await window.electronAPI.fs.copyFile(srcPath, destPath);
          } else {
            await window.electronAPI.fs.rename(srcPath, destPath);
          }
        }
      } catch (err) {
        notify.error('Error', `Failed to paste: ${err}`);
      }
    }
    loadDirectory(currentPath);
    if (clipboard.action === 'cut') setClipboard(null);
    notify.success('Pasted', `${clipboard.paths.length} item(s) pasted`);
  }, [clipboard, currentPath, loadDirectory]);

  const handleRename = useCallback((entry: FileSystemEntry) => {
    setRenamingId(entry.path);
    setRenameValue(entry.name);
  }, []);

  const confirmRename = useCallback(async () => {
    if (!renamingId || !renameValue) return;
    const oldPath = renamingId;
    const newPath = `${currentPath}/${renameValue}`;
    try {
      if (window.electronAPI) {
        await window.electronAPI.fs.rename(oldPath, newPath);
      }
      loadDirectory(currentPath);
      notify.success('Renamed', `Item renamed to "${renameValue}"`);
    } catch (err) {
      notify.error('Error', `Failed to rename: ${err}`);
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renamingId, renameValue, currentPath, loadDirectory]);

  const filteredEntries = entries
    .filter((e) => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name) * dir;
        case 'size': return (a.size - b.size) * dir;
        case 'modified': return (a.modifiedTime - b.modifiedTime) * dir;
        case 'type': return (a.extension || '').localeCompare(b.extension || '') * dir;
        default: return 0;
      }
    });

  const pathParts = currentPath.split('/');

  return (
    <div className="flex h-full">
      <div className="w-56 border-r border-border bg-surface-hover flex flex-col">
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                currentPath === item.path ? 'bg-primary/15 text-primary' : 'hover:bg-surface-hover text-text-secondary'
              )}
              onClick={() => navigateTo(item.path)}
            >
              <item.icon className="w-4 h-4" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface">
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded hover:bg-surface-hover transition-colors disabled:opacity-30"
              onClick={goBack}
              disabled={historyIndex === 0}
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-surface-hover transition-colors disabled:opacity-30"
              onClick={goForward}
              disabled={historyIndex === history.length - 1}
              aria-label="Go forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-surface-hover transition-colors"
              onClick={goUp}
              aria-label="Go up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-surface-hover transition-colors"
              onClick={goHome}
              aria-label="Go home"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 flex-1 min-w-0 px-2">
            {pathParts.map((part, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-text-muted" />}
                <button
                  className="px-1.5 py-0.5 rounded text-sm hover:bg-surface-hover transition-colors truncate max-w-[120px]"
                  onClick={() => navigateTo(pathParts.slice(0, i + 1).join('/'))}
                >
                  {part || '~'}
                </button>
              </div>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-48 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <button
              className={cn('p-1.5 rounded transition-colors', viewMode === 'grid' ? 'bg-primary/15 text-primary' : 'hover:bg-surface-hover text-text-muted')}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              className={cn('p-1.5 rounded transition-colors', viewMode === 'list' ? 'bg-primary/15 text-primary' : 'hover:bg-surface-hover text-text-muted')}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <button
              className="p-1.5 rounded hover:bg-surface-hover transition-colors text-text-muted"
              onClick={handleCreateFolder}
              aria-label="New folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-surface-hover transition-colors text-text-muted"
              onClick={handleCreateFile}
              aria-label="New file"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-surface-hover transition-colors text-text-muted"
              onClick={() => loadDirectory(currentPath)}
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-border text-sm">
            <span className="text-text-muted">{selected.size} selected</span>
            <div className="flex-1" />
            <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-hover transition-colors text-text-secondary" onClick={handleCopy}>
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-hover transition-colors text-text-secondary" onClick={handleCut}>
              <Clipboard className="w-3.5 h-3.5" /> Cut
            </button>
            {clipboard && (
              <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-hover transition-colors text-text-secondary" onClick={handlePaste}>
                <Clipboard className="w-3.5 h-3.5" /> Paste
              </button>
            )}
            <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-danger/10 transition-colors text-danger" onClick={() => handleDelete(Array.from(selected))}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}

        <div
          className="flex-1 overflow-auto p-4"
          onContextMenu={(e) => handleContextMenu(e)}
          onClick={() => setSelected(new Set())}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <Folder className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg font-medium text-text mb-1">No items</p>
              <p className="text-sm">This folder is empty</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
              {filteredEntries.map((entry) => {
                const Icon = getFileIconComponent(entry);
                const isRenaming = renamingId === entry.path;
                return (
                  <div
                    key={entry.path}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-all duration-100 select-none group',
                      selected.has(entry.path) ? 'bg-primary/15 ring-1 ring-primary' : 'hover:bg-surface-hover'
                    )}
                    onClick={(e) => handleEntryClick(entry, e)}
                    onDoubleClick={() => handleEntryDoubleClick(entry)}
                    onContextMenu={(e) => handleContextMenu(e, entry)}
                  >
                    <Icon className={cn('w-10 h-10', entry.isDirectory ? 'text-primary' : 'text-text-muted')} />
                    {isRenaming ? (
                      <div className="w-full flex items-center gap-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingId(null); }}
                          onBlur={confirmRename}
                          className="w-full px-1 py-0.5 text-xs bg-surface border border-primary rounded text-center focus:outline-none"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-text truncate w-full text-center">{entry.name}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="flex items-center gap-4 px-3 py-2 text-xs font-medium text-text-muted uppercase tracking-wide border-b border-border">
                <span className="flex-1">Name</span>
                <span className="w-24 text-right">Size</span>
                <span className="w-32 text-right">Modified</span>
                <span className="w-20 text-right">Type</span>
              </div>
              {filteredEntries.map((entry) => {
                const Icon = getFileIconComponent(entry);
                const isRenaming = renamingId === entry.path;
                const ext = entry.extension?.toUpperCase() || 'Folder';
                return (
                  <div
                    key={entry.path}
                    className={cn(
                      'flex items-center gap-4 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none',
                      selected.has(entry.path) ? 'bg-primary/15 ring-1 ring-primary' : 'hover:bg-surface-hover'
                    )}
                    onClick={(e) => handleEntryClick(entry, e)}
                    onDoubleClick={() => handleEntryDoubleClick(entry)}
                    onContextMenu={(e) => handleContextMenu(e, entry)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon className={cn('w-5 h-5 flex-shrink-0', entry.isDirectory ? 'text-primary' : 'text-text-muted')} />
                      {isRenaming ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingId(null); }}
                          onBlur={confirmRename}
                          className="flex-1 px-2 py-0.5 text-sm bg-surface border border-primary rounded focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm text-text truncate">{entry.name}</span>
                      )}
                    </div>
                    <span className="w-24 text-right text-sm text-text-muted">{entry.isFile ? formatBytes(entry.size) : '-'}</span>
                    <span className="w-32 text-right text-sm text-text-muted">{formatRelativeTime(entry.modifiedTime)}</span>
                    <span className="w-20 text-right text-xs text-text-muted uppercase">{ext}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface text-xs text-text-muted">
          <span>{filteredEntries.length} item(s)</span>
          <span>{currentPath}</span>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          entry={contextMenu.entry}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onCreateFolder={handleCreateFolder}
          onCreateFile={handleCreateFile}
        />
      )}
    </div>
  );
}

function ContextMenu({ x, y, entry, onClose, onRename, onDelete, onCopy, onCut, onPaste, onCreateFolder, onCreateFile }: {
  x: number; y: number; entry?: FileSystemEntry; onClose: () => void;
  onRename: (entry: FileSystemEntry) => void; onDelete: (paths: string[]) => void;
  onCopy: () => void; onCut: () => void; onPaste: () => void;
  onCreateFolder: () => void; onCreateFile: () => void;
}) {
  const items = entry ? [
    { label: 'Open', icon: entry.isDirectory ? Folder : File, onClick: () => { if (entry.isDirectory) onClose(); } },
    { type: 'separator' as const },
    { label: 'Rename', icon: Edit3, onClick: () => onRename(entry), shortcut: 'F2' },
    { label: 'Copy', icon: Copy, onClick: onCopy, shortcut: '⌘C' },
    { label: 'Cut', icon: Clipboard, onClick: onCut, shortcut: '⌘X' },
    { type: 'separator' as const },
    { label: 'Delete', icon: Trash2, onClick: () => onDelete([entry.path]), variant: 'danger' as const, shortcut: 'Del' },
  ] : [
    { label: 'New Folder', icon: FolderPlus, onClick: onCreateFolder },
    { label: 'New File', icon: FileText, onClick: onCreateFile },
    { type: 'separator' as const },
    { label: 'Paste', icon: Clipboard, onClick: onPaste, shortcut: '⌘V' },
  ];

  useEffect(() => {
    const handleClick = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-[400] bg-surface border border-border rounded-lg shadow-window p-1 min-w-[180px] animate-in"
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item, i) => (
        item.type === 'separator' ? (
          <div key={i} className="h-px bg-border my-1" />
        ) : (
          <button
            key={i}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              'hover:bg-surface-hover',
              item.variant === 'danger' && 'text-danger hover:bg-danger/10'
            )}
            onClick={(e) => { e.stopPropagation(); item.onClick(); onClose(); }}
            role="menuitem"
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && <span className="text-xs text-text-muted font-mono">{item.shortcut}</span>}
          </button>
        )
      ))}
    </div>
  );
}