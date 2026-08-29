import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WindowState, AppMetadata } from '@shared/types';
import { DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '@shared/constants';

interface WindowStoreState {
  windows: Map<string, WindowState>;
  zIndexCounter: number;
  openWindow: (app: AppMetadata, options?: Partial<WindowState>) => string;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  moveWindow: (windowId: string, x: number, y: number) => void;
  resizeWindow: (windowId: string, width: number, height: number) => void;
  setWindowTitle: (windowId: string, title: string) => void;
  getWindow: (windowId: string) => WindowState | undefined;
  getFocusedWindow: () => WindowState | undefined;
  getWindowsByApp: (appId: string) => WindowState[];
  closeAllWindows: (appId: string) => void;
  bringToFront: (windowId: string) => void;
  sendToBack: (windowId: string) => void;
}

const generateWindowId = (appId: string): string => {
  return `${appId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getInitialPosition = (zIndex: number) => {
  const offset = (zIndex % 10) * 20;
  return { x: 100 + offset, y: 100 + offset };
};

export const useWindowStore = create<WindowStoreState>()(
  persist(
    (set, get) => ({
      windows: new Map(),
      zIndexCounter: 100,

      openWindow: (app, options) => {
        const windowId = generateWindowId(app.id);
        const { windows, zIndexCounter } = get();
        const position = getInitialPosition(zIndexCounter);

        const newWindow: WindowState = {
          id: windowId,
          appId: app.id,
          title: app.name,
          width: DEFAULT_WINDOW_WIDTH,
          height: DEFAULT_WINDOW_HEIGHT,
          isMaximized: false,
          isMinimized: false,
          isFocused: true,
          zIndex: zIndexCounter + 1,
          minWidth: MIN_WINDOW_WIDTH,
          minHeight: MIN_WINDOW_HEIGHT,
          resizable: true,
          movable: true,
          ...position,
          ...options,
        };

        const newWindows = new Map(windows);
        newWindows.set(windowId, newWindow);

        set({
          windows: newWindows,
          zIndexCounter: zIndexCounter + 1,
        });

        get().focusWindow(windowId);
        return windowId;
      },

      closeWindow: (windowId) => {
        const { windows } = get();
        const newWindows = new Map(windows);
        newWindows.delete(windowId);
        set({ windows: newWindows });
      },

      focusWindow: (windowId) => {
        const { windows, zIndexCounter } = get();
        const window = windows.get(windowId);
        if (!window) return;

        const newWindows = new Map(windows);
        newWindows.forEach((w) => {
          newWindows.set(w.id, { ...w, isFocused: w.id === windowId });
        });

        const focusedWindow = newWindows.get(windowId)!;
        newWindows.set(windowId, { ...focusedWindow, zIndex: zIndexCounter + 1, isFocused: true });

        set({
          windows: newWindows,
          zIndexCounter: zIndexCounter + 1,
        });
      },

      minimizeWindow: (windowId) => {
        const { windows } = get();
        const window = windows.get(windowId);
        if (!window) return;

        const newWindows = new Map(windows);
        newWindows.set(windowId, { ...window, isMinimized: true, isFocused: false });
        set({ windows: newWindows });
      },

      maximizeWindow: (windowId) => {
        const { windows } = get();
        const window = windows.get(windowId);
        if (!window) return;

        const newWindows = new Map(windows);
        newWindows.set(windowId, { ...window, isMaximized: !window.isMaximized });
        set({ windows: newWindows });
      },

      restoreWindow: (windowId) => {
        const { windows } = get();
        const window = windows.get(windowId);
        if (!window) return;

        const newWindows = new Map(windows);
        newWindows.set(windowId, { ...window, isMinimized: false, isMaximized: false });
        set({ windows: newWindows });
        get().focusWindow(windowId);
      },

      moveWindow: (windowId, x, y) => {
        const { windows } = get();
        const window = windows.get(windowId);
        if (!window || window.isMaximized) return;

        const newWindows = new Map(windows);
        newWindows.set(windowId, { ...window, x, y });
        set({ windows: newWindows });
      },

      resizeWindow: (windowId, width, height) => {
        const { windows } = get();
        const window = windows.get(windowId);
        if (!window || window.isMaximized) return;

        const newWidth = Math.max(window.minWidth || MIN_WINDOW_WIDTH, width);
        const newHeight = Math.max(window.minHeight || MIN_WINDOW_HEIGHT, height);

        const newWindows = new Map(windows);
        newWindows.set(windowId, { ...window, width: newWidth, height: newHeight });
        set({ windows: newWindows });
      },

      setWindowTitle: (windowId, title) => {
        const { windows } = get();
        const window = windows.get(windowId);
        if (!window) return;

        const newWindows = new Map(windows);
        newWindows.set(windowId, { ...window, title });
        set({ windows: newWindows });
      },

      getWindow: (windowId) => get().windows.get(windowId),

      getFocusedWindow: () => {
        const { windows } = get();
        for (const window of windows.values()) {
          if (window.isFocused) return window;
        }
        return undefined;
      },

      getWindowsByApp: (appId) => {
        const { windows } = get();
        return Array.from(windows.values()).filter((w) => w.appId === appId);
      },

      closeAllWindows: (appId) => {
        const { windows } = get();
        const newWindows = new Map(windows);
        for (const [id, window] of newWindows) {
          if (window.appId === appId) newWindows.delete(id);
        }
        set({ windows: newWindows });
      },

      bringToFront: (windowId) => get().focusWindow(windowId),

      sendToBack: (windowId) => {
        const { windows } = get();
        const window = windows.get(windowId);
        if (!window) return;

        const minZIndex = Math.min(...Array.from(windows.values()).map((w) => w.zIndex));
        const newWindows = new Map(windows);
        newWindows.set(windowId, { ...window, zIndex: minZIndex - 1 });
        set({ windows: newWindows });
      },
    }),
    {
      name: 'ai-os-window-states',
      version: 1,
      serialize: (state) => JSON.stringify({
        windows: Array.from(state.windows.entries()),
        zIndexCounter: state.zIndexCounter,
      }),
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          windows: new Map(parsed.windows),
          zIndexCounter: parsed.zIndexCounter,
        };
      },
    }
  )
);