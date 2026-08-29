import { useRef, useEffect, useState, useCallback } from 'react';
import { Folder, FileText, Terminal, Settings, Calculator, Calendar, CheckSquare, Store, Bot, Activity, Info, RefreshCw, Monitor } from 'lucide-react';
import { cn } from '@shared/utils';
import { useDesktopStore } from '@/stores/desktopStore';
import { useWindowStore } from '@/stores/windowStore';
import { useAppStore } from '@/stores/appStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ContextMenu } from '@/components/common/ContextMenu';
import { getFileIcon } from '@shared/utils';
import { DESKTOP_ICON_SIZE, DESKTOP_GRID_SIZE } from '@shared/constants';
import type { DesktopIcon, AppMetadata } from '@shared/types';

const APP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  'file-text': FileText,
  terminal: Terminal,
  settings: Settings,
  calculator: Calculator,
  calendar: Calendar,
  'check-square': CheckSquare,
  store: Store,
  bot: Bot,
  activity: Activity,
  info: Info,
  monitor: Monitor,
  code: FileText,
  music: FileText,
  image: FileText,
  database: FileText,
  default: FileText,
};

function DesktopIconComponent({ icon, name, position, selected, onClick, onDoubleClick, onContextMenu, onDragStart }: {
  icon: string;
  name: string;
  position: { x: number; y: number };
  selected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const IconComponent = APP_ICONS[icon] || APP_ICONS.default;

  return (
    <div
      className={cn(
        'flex flex-col items-center cursor-pointer select-none transition-all duration-150',
        'w-[80px] h-[96px]',
        selected && 'bg-primary/10 rounded-lg',
        'hover:bg-surface-hover rounded-lg'
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: `translate(${position.x}px, ${position.y}px)`,
      } as React.CSSProperties}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={onDragStart}
      tabIndex={0}
      role="button"
      aria-label={name}
    >
      <div className={cn(
        'flex items-center justify-center w-12 h-12 rounded-lg mb-2',
        'bg-surface border border-border',
        selected && 'border-primary bg-primary/10'
      )}>
        <IconComponent className="w-6 h-6 text-text" />
      </div>
      <span className="text-xs text-text truncate w-full text-center px-1">{name}</span>
    </div>
  );
}

export function Desktop() {
  const { icons, wallpaper, updateIconPosition, reorderIcons, getNextIconPosition } = useDesktopStore();
  const { openWindow } = useWindowStore();
  const { getApp, launchApp } = useAppStore();
  const { addNotification } = useNotificationStore();

  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<{ iconId: string; offsetX: number; offsetY: number } | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  const handleIconClick = useCallback((iconId: string, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      setSelectedIcons((prev) => {
        const next = new Set(prev);
        if (next.has(iconId)) next.delete(iconId);
        else next.add(iconId);
        return next;
      });
    } else {
      setSelectedIcons(new Set([iconId]));
    }
  }, []);

  const handleIconDoubleClick = useCallback((icon: DesktopIcon) => {
    const app = getApp(icon.appId);
    if (app) {
      launchApp(icon.appId);
      openWindow(app);
    }
  }, [getApp, launchApp, openWindow]);

  const handleIconContextMenu = useCallback((icon: DesktopIcon, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedIcons(new Set([icon.id]));
  }, []);

  const handleDragStart = useCallback((icon: DesktopIcon, e: React.DragEvent) => {
    if (!desktopRef.current) return;

    const rect = desktopRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - icon.x;
    const offsetY = e.clientY - rect.top - icon.y;

    setDragState({ iconId: icon.id, offsetX, offsetY });
    setSelectedIcons(new Set([icon.id]));

    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    if (!dragState || !desktopRef.current) return;

    const rect = desktopRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragState.offsetX;
    const y = e.clientY - rect.top - dragState.offsetY;

    const snappedX = Math.round(x / DESKTOP_GRID_SIZE) * DESKTOP_GRID_SIZE;
    const snappedY = Math.round(y / DESKTOP_GRID_SIZE) * DESKTOP_GRID_SIZE;

    updateIconPosition(dragState.iconId, snappedX, snappedY);
    setDragState(null);
  }, [dragState, updateIconPosition]);

  const handleDesktopClick = useCallback(() => {
    setSelectedIcons(new Set());
  }, []);

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedIcons(new Set());
  }, []);

  return (
    <div
      ref={desktopRef}
      className="fixed inset-0 overflow-auto"
      style={{
        backgroundColor: 'var(--color-background)',
        backgroundImage: wallpaper ? `url(${wallpaper})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={handleDesktopClick}
      onContextMenu={handleDesktopContextMenu}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 pointer-events-none">
        {icons.map((icon) => (
          <DesktopIconComponent
            key={icon.id}
            icon={icon.icon}
            name={icon.name}
            position={{ x: icon.x, y: icon.y }}
            selected={selectedIcons.has(icon.id)}
            onClick={() => handleIconClick(icon.id, { shiftKey: false, metaKey: false, ctrlKey: false } as React.MouseEvent)}
            onDoubleClick={() => handleIconDoubleClick(icon)}
            onContextMenu={(e) => handleIconContextMenu(icon, e)}
            onDragStart={(e) => handleDragStart(icon, e)}
          />
        ))}
      </div>

      {dragState && (
        <div
          className="fixed pointer-events-none z-[1000] opacity-50"
          style={{
            left: dragState.offsetX,
            top: dragState.offsetY,
          }}
        >
          <div className="flex flex-col items-center w-[80px]">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-surface border border-border shadow-lg">
              <Folder className="w-6 h-6 text-text" />
            </div>
            <span className="text-xs text-text truncate w-full text-center px-1 bg-surface/90 backdrop-blur rounded px-1 py-0.5">
              Moving...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}