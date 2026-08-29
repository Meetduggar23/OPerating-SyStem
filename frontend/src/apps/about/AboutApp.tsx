import { Monitor, Cpu, MemoryStick, Globe, Heart } from 'lucide-react';
import { cn } from '@/utils';
import { APP_NAME, APP_VERSION, APP_BUILD } from '@/constants';

interface AboutAppProps {}

export function AboutApp({}: AboutAppProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-surface overflow-y-auto">
      <div className="max-w-lg w-full space-y-8">
        <div className="flex flex-col items-center text-center">
          <img src="/logo.png" alt={APP_NAME} className="w-24 h-24 rounded-2xl shadow-window mb-4" />
          <h1 className="text-2xl font-bold text-text">{APP_NAME}</h1>
          <p className="text-sm text-text-muted mt-1">Version {APP_VERSION} ({APP_BUILD})</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InfoCard icon={Monitor} label="Platform" value={navigator.platform} />
          <InfoCard icon={Globe} label="Browser" value={navigator.userAgent.split(' ').pop() || 'Unknown'} />
          <InfoCard icon={Cpu} label="Cores" value={`${navigator.hardwareConcurrency || 'Unknown'} cores`} />
          <InfoCard icon={MemoryStick} label="Memory" value={`${(navigator as unknown as { deviceMemory?: number }).deviceMemory || 8} GB`} />
        </div>

        <div className="p-4 bg-surface border border-border rounded-xl">
          <h3 className="text-sm font-semibold text-text mb-3">System Status</h3>
          <div className="space-y-2">
            <StatusRow label="Frontend" status="operational" />
            <StatusRow label="Database" status="operational" />
            <StatusRow label="Window Manager" status="operational" />
            <StatusRow label="AI Service" status={typeof window !== 'undefined' && window.electronAPI ? 'operational' : 'simulated'} />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs text-text-muted">
            Built with React, TypeScript, Electron, and SQLite
          </p>
          <p className="text-xs text-text-muted flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-danger fill-danger" /> by AI OS Team
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="p-3 bg-surface border border-border rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <p className="text-sm font-medium text-text truncate">{value}</p>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: 'operational' | 'degraded' | 'down' | 'simulated' }) {
  const colors = {
    operational: 'bg-success',
    degraded: 'bg-warning',
    down: 'bg-danger',
    simulated: 'bg-accent',
  };
  const labels = {
    operational: 'Operational',
    degraded: 'Degraded',
    down: 'Down',
    simulated: 'Simulated',
  };
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text">{label}</span>
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', colors[status])} />
        <span className="text-xs text-text-muted">{labels[status]}</span>
      </div>
    </div>
  );
}