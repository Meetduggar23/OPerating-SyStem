import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { useAppStore } from '@/stores/appStore';
import type { WindowState, AppMetadata } from '@shared/types';

export function useWindow(windowId: string) {
  const {
    windows,
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    moveWindow,
    resizeWindow,
    setWindowTitle,
    bringToFront,
    sendToBack,
  } = useWindowStore();

  const window = windows.get(windowId);

  return {
    window,
    focus: useCallback(() => focusWindow(windowId), [focusWindow, windowId]),
    close: useCallback(() => closeWindow(windowId), [closeWindow, windowId]),
    minimize: useCallback(() => minimizeWindow(windowId), [minimizeWindow, windowId]),
    maximize: useCallback(() => maximizeWindow(windowId), [maximizeWindow, windowId]),
    restore: useCallback(() => restoreWindow(windowId), [restoreWindow, windowId]),
    move: useCallback((x: number, y: number) => moveWindow(windowId, x, y), [moveWindow, windowId]),
    resize: useCallback((width: number, height: number) => resizeWindow(windowId, width, height), [resizeWindow, windowId]),
    setTitle: useCallback((title: string) => setWindowTitle(windowId, title), [setWindowTitle, windowId]),
    bringToFront: useCallback(() => bringToFront(windowId), [bringToFront, windowId]),
    sendToBack: useCallback(() => sendToBack(windowId), [sendToBack, windowId]),
    isFocused: window?.isFocused ?? false,
    isMinimized: window?.isMinimized ?? false,
    isMaximized: window?.isMaximized ?? false,
  };
}

export function useWindowManager() {
  const { openWindow, getWindowsByApp, closeAllWindows } = useWindowStore();
  const { getApp, launchApp } = useAppStore();

  const openApp = useCallback(
    (appId: string, options?: Partial<WindowState>) => {
      const app = getApp(appId);
      if (!app) return null;

      launchApp(appId);
      return openWindow(app, options);
    },
    [getApp, launchApp, openWindow]
  );

  const closeApp = useCallback(
    (appId: string) => {
      closeAllWindows(appId);
    },
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

  const getOrCreateWindow = useCallback(
    (appId: string, options?: Partial<WindowState>) => {
      const existing = getWindowsByApp(appId);
      if (existing.length > 0) {
        const window = existing[0];
        useWindowStore.getState().focusWindow(window.id);
        if (window.isMinimized) useWindowStore.getState().restoreWindow(window.id);
        return window.id;
      }
      return openApp(appId, options);
    },
    [getWindowsByApp, openApp]
  );

  return {
    openApp,
    closeApp,
    getAppWindows,
    isAppRunning,
    getOrCreateWindow,
  };
}

export function useDragWindow(windowId: string, handleRef: React.RefObject<HTMLElement>) {
  const { window, move, isMaximized } = useWindow(windowId);
  const dragRef = useRef<{ x: number; y: number; windowX: number; windowY: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      if (e.button !== 0) return;

      const handle = handleRef.current;
      if (!handle || !handle.contains(e.target as Node)) return;

      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        windowX: window?.x ?? 0,
        windowY: window?.y ?? 0,
      };

      e.preventDefault();
    },
    [handleRef, isMaximized, window]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;

      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;

      move(dragRef.current.windowX + dx, dragRef.current.windowY + dy);
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
  }, [move]);

  return { onMouseDown: handleMouseDown };
}

export function useResizeWindow(windowId: string, direction: 'se' | 's' | 'e' | 'sw' | 'w' | 'nw' | 'n' | 'ne') {
  const { window, resize, isMaximized } = useWindow(windowId);
  const dragRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      if (e.button !== 0) return;

      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: window?.width ?? 0,
        height: window?.height ?? 0,
      };

      e.preventDefault();
      e.stopPropagation();
    },
    [isMaximized, window]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !window) return;

      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;

      let newWidth = dragRef.current.width;
      let newHeight = dragRef.current.height;

      if (direction.includes('e')) newWidth = dragRef.current.width + dx;
      if (direction.includes('w')) newWidth = dragRef.current.width - dx;
      if (direction.includes('s')) newHeight = dragRef.current.height + dy;
      if (direction.includes('n')) newHeight = dragRef.current.height - dy;

      resize(newWidth, newHeight);
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
  }, [resize, window, direction]);

  const cursors: Record<string, string> = {
    se: 'se-resize',
    sw: 'sw-resize',
    ne: 'ne-resize',
    nw: 'nw-resize',
    s: 's-resize',
    n: 'n-resize',
    e: 'e-resize',
    w: 'w-resize',
  };

  return {
    onMouseDown: handleMouseDown,
    style: { cursor: cursors[direction] },
  };
}