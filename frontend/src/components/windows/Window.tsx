import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { X, Maximize2, Minimize, MousePointer2 } from 'lucide-react';
import { cn } from '@shared/utils';
import { useWindowStore } from '@/stores/windowStore';
import { useDragWindow, useResizeWindow } from '@/hooks/useWindow';
import type { WindowState } from '@shared/types';

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

export const Window = forwardRef<HTMLDivElement, WindowProps>(
  ({ id, title, children, className, showControls = true, resizable = true, onClose, onMinimize, onMaximize }, ref) => {
    const { window, focus, close, minimize, maximize, restore, isFocused, isMinimized, isMaximized } = useWindowStore(
      (state) => ({
        window: state.windows.get(id),
        focus: state.focusWindow,
        close: state.closeWindow,
        minimize: state.minimizeWindow,
        maximize: state.maximizeWindow,
        restore: state.restoreWindow,
        isFocused: state.windows.get(id)?.isFocused ?? false,
        isMinimized: state.windows.get(id)?.isMinimized ?? false,
        isMaximized: state.windows.get(id)?.isMaximized ?? false,
      })
    );

    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const { onMouseDown: handleDragStart } = useDragWindow(id, headerRef);
    const { onMouseDown: handleResizeSE, style: resizeSEStyle } = useResizeWindow(id, 'se');
    const { onMouseDown: handleResizeS, style: resizeSStyle } = useResizeWindow(id, 's');
    const { onMouseDown: handleResizeE, style: resizeEStyle } = useResizeWindow(id, 'e');

    useImperativeHandle(ref, () => ({
      focus,
      close,
      minimize,
      maximize,
      restore,
      getElement: () => contentRef.current,
    }));

    const handleClose = () => {
      onClose?.();
      close();
    };

    const handleMinimize = () => {
      onMinimize?.();
      minimize();
    };

    const handleMaximize = () => {
      if (isMaximized) {
        restore();
        onMaximize?.();
      } else {
        maximize();
        onMaximize?.();
      }
    };

    const handleHeaderClick = () => {
      if (!isFocused) focus();
    };

    if (!window || isMinimized) return null;

    return (
      <div
        ref={contentRef}
        className={cn(
          'window',
          isFocused && 'window-active',
          className
        )}
        style={{
          left: window.x,
          top: window.y,
          width: window.width,
          height: window.height,
          zIndex: window.zIndex,
        } as React.CSSProperties}
        onMouseDown={handleHeaderClick}
        data-window-id={id}
      >
        <div
          ref={headerRef}
          className={cn(
            'window-header',
            'select-none',
            'cursor-default',
            isFocused ? 'bg-surface-hover' : 'bg-surface'
          )}
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="window-title truncate">{title}</span>
          </div>

          {showControls && (
            <div className="window-controls flex items-center gap-1">
              <button
                className="window-control-btn window-control-minimize"
                onClick={handleMinimize}
                aria-label="Minimize"
              >
                <Minimize className="w-4 h-4" />
              </button>
              <button
                className="window-control-btn window-control-maximize"
                onClick={handleMaximize}
                aria-label={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? (
                  <MousePointer2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                className="window-control-btn window-control-close"
                onClick={handleClose}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="window-content" ref={contentRef}>
          {children}
        </div>

        {resizable && !isMaximized && (
          <>
            <div
              className="absolute bottom-0 right-0 w-4 h-4"
              style={resizeSEStyle}
              onMouseDown={handleResizeSE}
              aria-label="Resize diagonal"
            />
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1 -translate-y-1/2"
              style={resizeSStyle}
              onMouseDown={handleResizeS}
              aria-label="Resize vertical"
            />
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-full -translate-x-1/2"
              style={resizeEStyle}
              onMouseDown={handleResizeE}
              aria-label="Resize horizontal"
            />
          </>
        )}
      </div>
    );
  }
);

Window.displayName = 'Window';