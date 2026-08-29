import { useRef } from 'react';
import { X, Maximize2, Minimize, MousePointer2 } from 'lucide-react';
import { useWindowStore } from '@/stores/windowStore';
import { useDragWindow, useResizeWindow } from '@/hooks/useWindow';
import { cn } from '@/utils';

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  showControls?: boolean;
  resizable?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export function Window({ id, title, children, className, showControls = true, resizable = true, onClose, onMinimize, onMaximize }: WindowProps) {
  const windowState = useWindowStore((state) => state.windows.get(id));

  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isFocused = windowState?.isFocused ?? false;
  const isMinimized = windowState?.isMinimized ?? false;
  const isMaximized = windowState?.isMaximized ?? false;

  const { onMouseDown: handleDragStart } = useDragWindow(id, headerRef);
  const { onMouseDown: handleResizeSE, style: resizeSEStyle } = useResizeWindow(id, 'se');
  const { onMouseDown: handleResizeS, style: resizeSStyle } = useResizeWindow(id, 's');
  const { onMouseDown: handleResizeE, style: resizeEStyle } = useResizeWindow(id, 'e');

  const handleClose = () => {
    onClose?.();
    useWindowStore.getState().closeWindow(id);
  };

  const handleMinimize = () => {
    onMinimize?.();
    useWindowStore.getState().minimizeWindow(id);
  };

  const handleMaximize = () => {
    if (isMaximized) {
      useWindowStore.getState().restoreWindow(id);
    } else {
      useWindowStore.getState().maximizeWindow(id);
    }
    onMaximize?.();
  };

  const handleHeaderClick = () => {
    if (!isFocused) useWindowStore.getState().focusWindow(id);
  };

  if (!windowState || isMinimized) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'fixed bg-surface border border-border rounded-xl shadow-[0_4px_20px_-2px_rgb(0,0,0,0.15)] flex flex-col overflow-hidden transition-all duration-150',
        isFocused && 'shadow-[0_4px_24px_-2px_rgb(173,139,115,0.2)] border-border-dark z-[200]',
        className
      )}
      style={{
        left: windowState.x,
        top: windowState.y,
        width: windowState.width,
        height: windowState.height,
        zIndex: windowState.zIndex,
      } as React.CSSProperties}
      onMouseDown={handleHeaderClick}
      data-window-id={id}
    >
      <div
        ref={headerRef}
        className={cn(
          'flex items-center justify-between select-none cursor-default border-b border-border',
          isFocused ? 'bg-surface-hover' : 'bg-surface'
        )}
        style={{ padding: '10px 16px' }}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-medium text-text truncate">{title}</span>
        </div>

        {showControls && (
          <div className="flex items-center gap-1">
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-active transition-all duration-100"
              onClick={handleMinimize}
              aria-label="Minimize"
            >
              <Minimize className="w-4 h-4" />
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-active transition-all duration-100"
              onClick={handleMaximize}
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <MousePointer2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-inverse hover:bg-danger transition-all duration-100"
              onClick={handleClose}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4" ref={contentRef}>
        {children}
      </div>

      {resizable && !isMaximized && (
        <>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            style={resizeSEStyle}
            onMouseDown={handleResizeSE}
            aria-label="Resize diagonal"
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1 -translate-y-1/2 cursor-s-resize"
            style={resizeSStyle}
            onMouseDown={handleResizeS}
            aria-label="Resize vertical"
          />
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-full -translate-x-1/2 cursor-e-resize"
            style={resizeEStyle}
            onMouseDown={handleResizeE}
            aria-label="Resize horizontal"
          />
        </>
      )}
    </div>
  );
}

Window.displayName = 'Window';