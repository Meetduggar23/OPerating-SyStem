import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DesktopIcon } from '@/types';
import { DESKTOP_ICON_SIZE, DESKTOP_GRID_SIZE } from '@/constants';

interface DesktopState {
  icons: DesktopIcon[];
  wallpaper: string;
  addIcon: (icon: Omit<DesktopIcon, 'id' | 'order'>) => void;
  removeIcon: (iconId: string) => void;
  updateIconPosition: (iconId: string, x: number, y: number) => void;
  reorderIcons: (icons: DesktopIcon[]) => void;
  setWallpaper: (wallpaper: string) => void;
  snapToGrid: (x: number, y: number) => { x: number; y: number };
  getNextIconPosition: () => { x: number; y: number };
}

const defaultIcons: DesktopIcon[] = [
  { id: 'icon-1', appId: 'file-manager', name: 'File Manager', icon: 'folder', x: 24, y: 24, order: 0 },
  { id: 'icon-2', appId: 'terminal', name: 'Terminal', icon: 'terminal', x: 24, y: 128, order: 1 },
  { id: 'icon-3', appId: 'notes', name: 'Notes', icon: 'file-text', x: 24, y: 232, order: 2 },
  { id: 'icon-4', appId: 'calculator', name: 'Calculator', icon: 'calculator', x: 24, y: 336, order: 3 },
  { id: 'icon-5', appId: 'settings', name: 'Settings', icon: 'settings', x: 24, y: 440, order: 4 },
];

export const useDesktopStore = create<DesktopState>()(
  persist(
    (set, get) => ({
      icons: defaultIcons,
      wallpaper: '',

      addIcon: (icon) => {
        const { icons } = get();
        const newIcon: DesktopIcon = {
          ...icon,
          id: `icon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order: icons.length,
        };
        set({ icons: [...icons, newIcon] });
      },

      removeIcon: (iconId) => {
        const { icons } = get();
        set({ icons: icons.filter((i) => i.id !== iconId) });
      },

      updateIconPosition: (iconId, x, y) => {
        const { icons } = get();
        const snapped = get().snapToGrid(x, y);
        set({
          icons: icons.map((i) =>
            i.id === iconId ? { ...i, x: snapped.x, y: snapped.y } : i
          ),
        });
      },

      reorderIcons: (icons) => {
        set({ icons: icons.map((icon, index) => ({ ...icon, order: index })) });
      },

      setWallpaper: (wallpaper) => set({ wallpaper }),

      snapToGrid: (x, y) => ({
        x: Math.round(x / DESKTOP_GRID_SIZE) * DESKTOP_GRID_SIZE,
        y: Math.round(y / DESKTOP_GRID_SIZE) * DESKTOP_GRID_SIZE,
      }),

      getNextIconPosition: () => {
        const { icons } = get();
        if (icons.length === 0) return { x: 24, y: 24 };

        const occupied = new Set(icons.map((i) => `${i.x},${i.y}`));
        let x = 24;
        let y = 24;

        while (occupied.has(`${x},${y}`)) {
          x += DESKTOP_GRID_SIZE;
          if (x > window.innerWidth - DESKTOP_ICON_SIZE - 24) {
            x = 24;
            y += DESKTOP_GRID_SIZE;
          }
        }

        return { x, y };
      },
    }),
    {
      name: 'ai-os-desktop',
      version: 1,
    }
  )
);