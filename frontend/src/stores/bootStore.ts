import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BootState {
  isBooted: boolean;
  bootProgress: number;
  bootStage: string;
  setBootProgress: (progress: number, stage?: string) => void;
  completeBoot: () => void;
  resetBoot: () => void;
}

export const useBootStore = create<BootState>()(
  persist(
    (set) => ({
      isBooted: false,
      bootProgress: 0,
      bootStage: 'Initializing...',
      setBootProgress: (progress, stage) => set({ bootProgress: progress, bootStage: stage || '' }),
      completeBoot: () => set({ isBooted: true, bootProgress: 100, bootStage: 'Ready' }),
      resetBoot: () => set({ isBooted: false, bootProgress: 0, bootStage: 'Initializing...' }),
    }),
    {
      name: 'ai-os-boot',
      version: 1,
    }
  )
);