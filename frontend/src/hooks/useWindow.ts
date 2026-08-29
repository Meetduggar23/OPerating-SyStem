import { useCallback, useEffect, useRef } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { useAppStore } from '@/stores/appStore';

export function useWindow(windowId: string) {
  const windowState = useWindowStore((state) => state.windows.get(windowId));
  const focus = useWindowStore((state) => state.focusWindow);
  const close = useWindowStore((state) => state.closeWindow);
  const minimize = useWindowStore((state) => state.minimizeWindow);
  const maximize = useWindowStore((state) => state.maximizeWindow);
  const restore = useWindowStore((state) => state.restoreWindow);
  const move = useWindowStore((state) => state.moveWindow);
  const resize = useWindowStore((state) => state.resizeWindow);
  const setWindowTitle = useWindowStore((state) => state.setWindowTitle);
  const bringToFront = useWindowStore((state) => state.bringToFront);
  const sendToBack = useWindowStore((state) => state.sendToBack);

  return {
    window: windowState,
    focus: useCallback(() => focus(windowId), [focus, windowId]),
    close: useCallback(() => close(windowId), [close, windowId]),
    minimize: useCallback(() => minimize(windowId), [minimize, windowId]),
    maximize: useCallback(() => maximize(windowId), [maximize, windowId]),
    restore: useCallback(() => restore(windowId), [restore, windowId]),
    move: useCallback((x: number, y: number) => move(windowId, x, y), [move, windowId]),
    resize: useCallback((width: number, height: number) => resize(windowId, width, height), [resize, windowId]),
    setTitle: useCallback((title: string) => setWindowTitle(windowId, title), [setWindowTitle, windowId]),
    bringToFront: useCallback(() => bringToFront(windowId), [bringToFront, windowId]),
    sendToBack: useCallback(() => sendToBack(windowId), [sendToBack, windowId]),
    isFocused: windowState?.isFocused ?? false,
    isMinimized: windowState?.isMinimized ?? false,
    isMaximized: windowState?.isMaximized ?? false,
  };
}

export function useWindowManager() {
  const openWindow = useWindowStore((state) => state.openWindow);
  const getWindowsByApp = useWindowStore((state) => state.getWindowsByApp);
  const closeAllWindows = useWindowStore((state) => state.closeAllWindows);
  const getApp = useAppStore((state) => state.getApp);
  const launchApp = useAppStore((state) => state.launchApp);

  const openApp = useCallback(
    (appId: string) => {
      const app = getApp(appId);
      if (!app) return null;
      launchApp(appId);
      return openWindow(app);
    },
    [getApp, launchApp, openWindow]
  );

  const closeApp = useCallback(
    (appId: string) => closeAllWindows(appId),
    [closeAllWindows]
  );

  const getAppWindows = useCallback(
    (appId: string) => getWindowsByApp(appId),
    [getWindowsByApp]
  );

  const isAppRunning = useCallback(
    (appId: string) => getWindowsByApp(appId).length > 0,
    [getWindowsByApp]
  );

  return { openApp, closeApp, getAppWindows, isAppRunning };
}

export function useDragWindow(windowId: string, handleRef: React.RefObject<HTMLElement>) {
  const windowState = useWindowStore((state) => state.windows.get(windowId));
  const move = useWindowStore((state) => state.moveWindow);
  const dragRef = useRef<{ x: number; y: number; windowX: number; windowY: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (windowState?.isMaximized) return;
      if (e.button !== 0) return;

      const handle = handleRef.current;
      if (!handle || !handle.contains(e.target as Node)) return;

      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        windowX: windowState?.x ?? 0,
        windowY: windowState?.y ?? 0,
      };

      e.preventDefault();
    },
    [handleRef, windowState?.isMaximized, windowState?.x, windowState?.y]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      move(windowId, dragRef.current.windowX + dx, dragRef.current.windowY + dy);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [move, windowId]);

  return { onMouseDown: handleMouseDown };
}

export function useResizeWindow(windowId: string, direction: 'se' | 's' | 'e' | 'sw' | 'w' | 'nw' | 'n' | 'ne') {
  const windowState = useWindowStore((state) => state.windows.get(windowId));
  const resize = useWindowStore((state) => state.resizeWindow);
  const dragRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (windowState?.isMaximized) return;
      if (e.button !== 0) return;

      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: windowState?.width ?? 0,
        height: windowState?.height ?? 0,
      };

      e.preventDefault();
      e.stopPropagation();
    },
    [windowState?.isMaximized, windowState?.width, windowState?.height]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !windowState) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      let newWidth = dragRef.current.width;
      let newHeight = dragRef.current.height;

      if (direction.includes('e')) newWidth = dragRef.current.width + dx;
      if (direction.includes('w')) newWidth = dragRef.current.width - dx;
      if (direction.includes('s')) newHeight = dragRef.current.height + dy;
      if (direction.includes('n')) newHeight = dragRef.current.height - dy;

      resize(windowId, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resize, windowId, windowState, direction]);

  const cursors: Record<string, string> = {
    se: 'se-resize', sw: 'sw-resize', ne: 'ne-resize', nw: 'nw-resize',
    s: 's-resize', n: 'n-resize', e: 'e-resize', w: 'w-resize',
  };

  return {
    onMouseDown: handleMouseDown,
    style: { cursor: cursors[direction] } as React.CSSProperties,
  };
}