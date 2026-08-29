import { useEffect, useState } from 'react';
import { cn } from '@/utils';
import { useBootStore } from '@/stores/bootStore';
import { APP_NAME, APP_VERSION, APP_BUILD } from '@/constants';

const BOOT_STAGES = [
  { progress: 10, stage: 'Initializing kernel...', delay: 300 },
  { progress: 25, stage: 'Loading system services...', delay: 400 },
  { progress: 40, stage: 'Mounting filesystems...', delay: 300 },
  { progress: 55, stage: 'Starting window manager...', delay: 400 },
  { progress: 70, stage: 'Loading applications...', delay: 500 },
  { progress: 85, stage: 'Initializing AI subsystem...', delay: 600 },
  { progress: 100, stage: 'Ready', delay: 200 },
];

export function BootScreen() {
  const { bootProgress, bootStage, setBootProgress, completeBoot } = useBootStore();
  const [showBoot, setShowBoot] = useState(true);
  const [logoVisible, setLogoVisible] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLogoVisible(true), 100);
    const timer2 = setTimeout(() => setProgressVisible(true), 500);
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, []);

  useEffect(() => {
    if (bootProgress >= 100) {
      const timer = setTimeout(() => {
        setShowBoot(false);
        completeBoot();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [bootProgress, completeBoot]);

  useEffect(() => {
    const runBootSequence = async () => {
      for (const stage of BOOT_STAGES) {
        if (!showBoot) break;
        setBootProgress(stage.progress, stage.stage);
        await new Promise((resolve) => setTimeout(resolve, stage.delay));
      }
    };
    runBootSequence();
  }, [setBootProgress, showBoot]);

  if (!showBoot) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        <div className={cn('transition-all duration-500 ease-out', logoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50')}>
          <img
            src="/logo.png"
            alt={APP_NAME}
            className="w-32 h-32 rounded-2xl shadow-window"
          />
        </div>

        <div className={cn('transition-all duration-500 ease-out', progressVisible ? 'opacity-100' : 'opacity-0')}>
          <div className="w-64 h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${bootProgress}%` }}
            />
          </div>
          <p className="text-sm text-text-muted mt-3 text-center min-h-[1.5rem]">{bootStage}</p>
        </div>

        <div className="text-xs text-text-muted mt-8 opacity-50">
          {APP_NAME} v{APP_VERSION} ({APP_BUILD})
        </div>
      </div>
    </div>
  );
}