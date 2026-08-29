import { useEffect, useRef, useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { cn } from '@shared/utils';

interface ContextMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  type?: 'separator';
}

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  x: number;
  y: number;
  items: ContextMenuItem[];
  triggerRef?: React.RefObject<HTMLElement>;
}

interface ContextMenuContextValue {
  close: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [openMenus, setOpenMenus] = useState<Array<{ id: string; x: number; y: number; items: ContextMenuItem[]; onClose: () => void }>>([]);

  const closeAll = useCallback(() => {
    setOpenMenus([]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeAll]);

  return (
    <ContextMenuContext.Provider value={{ close: closeAll }}>
      {children}
      {openMenus.map((menu) => (
        <ContextMenuRoot
          key={menu.id}
          id={menu.id}
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={() => {
            menu.onClose();
            setOpenMenus((prev) => prev.filter((m) => m.id !== menu.id));
          }}
        />
      ))}
    </ContextMenuContext.Provider>
  );
}

function ContextMenuRoot({ id, x, y, items, onClose }: { id: string; x: number; y: number; items: ContextMenuItem[]; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const validIndices = items.map((item, i) => (item.type !== 'separator' && !item.disabled ? i : -1)).filter((i) => i !== -1);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIdx = validIndices.indexOf(focusedIndex);
        const nextIdx = validIndices[(currentIdx + 1) % validIndices.length];
        setFocusedIndex(nextIdx);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIdx = validIndices.indexOf(focusedIndex);
        const prevIdx = validIndices[(currentIdx - 1 + validIndices.length) % validIndices.length];
        setFocusedIndex(prevIdx);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusedIndex >= 0 && items[focusedIndex]?.onClick) {
          items[focusedIndex].onClick!();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, onClose]);

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const menuWidth = 220;
  const menuHeight = items.length * 36 + 8;
  const adjustedX = Math.min(x, viewportWidth - menuWidth - 8);
  const adjustedY = Math.min(y, viewportHeight - menuHeight - 8);

  return (
    <div
      ref={menuRef}
      className="fixed z-[400] animate-in pointer-events-auto"
      style={{ left: adjustedX, top: adjustedY, width: menuWidth }}
      role="menu"
      tabIndex={0}
    >
      <div className="bg-surface border border-border rounded-lg shadow-window p-1">
        {items.map((item, index) => (
          item.type === 'separator' ? (
            <div key={index} className="h-px bg-border my-1" role="separator" />
          ) : (
            <button
              key={index}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                'hover:bg-surface-hover focus:bg-surface-hover focus:outline-none',
                item.disabled && 'opacity-50 cursor-not-allowed',
                item.variant === 'danger' && 'text-danger hover:bg-danger/10',
                focusedIndex === index && 'bg-surface-hover'
              )}
              onClick={() => {
                if (item.onClick) item.onClick();
                onClose();
              }}
              disabled={item.disabled}
              role="menuitem"
              tabIndex={-1}
            >
              {item.icon && (
                <span className="w-4 h-4 flex-shrink-0">
                  {typeof item.icon === 'function' ? <item.icon className="w-4 h-4" /> : item.icon}
                </span>
              )}
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && <span className="text-xs text-text-muted font-mono">{item.shortcut}</span>}
            </button>
          )
        ))}
      </div>
    </div>
  );
}

export function ContextMenu({ isOpen, onClose, x, y, items }: ContextMenuProps) {
  if (!isOpen) return null;

  return (
    <ContextMenuRoot
      id={`context-menu-${Date.now()}`}
      x={x}
      y={y}
      items={items}
      onClose={onClose}
    />
  );
}