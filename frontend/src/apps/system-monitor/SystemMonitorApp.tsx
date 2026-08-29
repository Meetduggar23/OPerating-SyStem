import { useState, useEffect } from 'react';
import { Cpu, HardDrive, MemoryStick, Clock } from 'lucide-react';
import { cn, formatBytes, formatDuration } from '@/utils';

interface SystemMonitorAppProps {
  windowId: string;
}

interface SystemData {
  cpu: number;
  memory: { total: number; used: number; free: number };
  disk: { total: number; used: number; free: number };
  uptime: number;
  processes: { name: string; cpu: number; memory: number; pid: number }[];
}

export function SystemMonitorApp({ windowId: _windowId }: SystemMonitorAppProps) {
  const [data, setData] = useState<SystemData>({
    cpu: 0, memory: { total: 8 * 1024 * 1024 * 1024, used: 0, free: 8 * 1024 * 1024 * 1024 },
    disk: { total: 256 * 1024 * 1024 * 1024, used: 0, free: 256 * 1024 * 1024 * 1024 },
    uptime: 0,
    processes: [],
  });
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'processes'>('overview');

  useEffect(() => {
    const updateData = () => {
      const cpu = Math.random() * 60 + 10;
      const memUsed = Math.floor(Math.random() * 4 * 1024 * 1024 * 1024);
      const diskUsed = Math.floor(120 * 1024 * 1024 * 1024 + Math.random() * 10 * 1024 * 1024 * 1024);
      const memTotal = 8 * 1024 * 1024 * 1024;
      const diskTotal = 256 * 1024 * 1024 * 1024;
      const processes = [
        { name: 'AI-OS Main', cpu: Math.random() * 15, memory: 256 * 1024 * 1024, pid: 1 },
        { name: 'Electron', cpu: Math.random() * 10, memory: 512 * 1024 * 1024, pid: 2 },
        { name: 'React DevTools', cpu: Math.random() * 5, memory: 128 * 1024 * 1024, pid: 3 },
        { name: 'Node.js', cpu: Math.random() * 8, memory: 192 * 1024 * 1024, pid: 4 },
        { name: 'SQLite', cpu: Math.random() * 3, memory: 64 * 1024 * 1024, pid: 5 },
        { name: 'Window Manager', cpu: Math.random() * 4, memory: 96 * 1024 * 1024, pid: 6 },
        { name: 'AI Service', cpu: Math.random() * 12, memory: 384 * 1024 * 1024, pid: 7 },
      ].sort((a, b) => b.cpu - a.cpu);

      setData({ cpu, memory: { total: memTotal, used: memUsed, free: memTotal - memUsed }, disk: { total: diskTotal, used: diskUsed, free: diskTotal - diskUsed }, uptime: Date.now() / 1000 - 86400 * 3, processes });
      setCpuHistory((prev) => [...prev.slice(-59), cpu]);
    };

    updateData();
    const interval = setInterval(updateData, 2000);
    return () => clearInterval(interval);
  }, []);

  const memPercent = (data.memory.used / data.memory.total) * 100;
  const diskPercent = (data.disk.used / data.disk.total) * 100;

  const CircularGauge = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-border)" strokeWidth="8" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${value * 2.51} 251`} strokeLinecap="round" className="transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-text">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="flex bg-surface-active border border-border rounded-lg p-0.5">
          {(['overview', 'processes'] as const).map((tab) => (
            <button key={tab} className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', activeTab === tab ? 'bg-primary text-text-inverse' : 'text-text-muted hover:bg-surface-hover')} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> Uptime: {formatDuration((Date.now() / 1000 - (Date.now() / 1000 - 86400 * 3)) * 1000)}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="flex justify-center gap-8 py-4">
              <CircularGauge value={data.cpu} label="CPU" color="var(--color-primary)" />
              <CircularGauge value={memPercent} label="Memory" color="var(--color-secondary)" />
              <CircularGauge value={diskPercent} label="Disk" color="var(--color-accent)" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="flex items-center gap-2 mb-2"><Cpu className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-text">CPU</span></div>
                <p className="text-2xl font-bold text-text">{data.cpu.toFixed(1)}%</p>
                <p className="text-xs text-text-muted mt-1">{navigator.hardwareConcurrency || 8} cores</p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="flex items-center gap-2 mb-2"><MemoryStick className="w-4 h-4 text-secondary" /><span className="text-sm font-medium text-text">Memory</span></div>
                <p className="text-2xl font-bold text-text">{formatBytes(data.memory.used)}</p>
                <p className="text-xs text-text-muted mt-1">of {formatBytes(data.memory.total)}</p>
                <div className="mt-2 h-2 bg-border rounded-full overflow-hidden"><div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${memPercent}%` }} /></div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="flex items-center gap-2 mb-2"><HardDrive className="w-4 h-4 text-accent-dark" /><span className="text-sm font-medium text-text">Disk</span></div>
                <p className="text-2xl font-bold text-text">{formatBytes(data.disk.used)}</p>
                <p className="text-xs text-text-muted mt-1">of {formatBytes(data.disk.total)}</p>
                <div className="mt-2 h-2 bg-border rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${diskPercent}%` }} /></div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-text mb-3">CPU History</h3>
              <div className="h-32 bg-surface border border-border rounded-xl p-3 flex items-end gap-px">
                {cpuHistory.map((value, i) => (
                  <div key={i} className="flex-1 bg-primary/60 rounded-t-sm transition-all duration-300" style={{ height: `${value}%` }} />
                ))}
                {cpuHistory.length === 0 && <div className="flex-1 flex items-center justify-center text-xs text-text-muted">Collecting data...</div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_100px_80px] gap-2 px-3 py-2 text-xs font-medium text-text-muted uppercase tracking-wide border-b border-border">
              <span>Process</span><span className="text-right">PID</span><span className="text-right">CPU</span><span className="text-right">Memory</span>
            </div>
            {data.processes.map((proc) => (
              <div key={proc.pid} className="grid grid-cols-[1fr_80px_100px_80px] gap-2 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors">
                <span className="text-sm text-text font-medium truncate">{proc.name}</span>
                <span className="text-sm text-text-muted text-right font-mono">{proc.pid}</span>
                <span className="text-sm text-text-muted text-right">{proc.cpu.toFixed(1)}%</span>
                <span className="text-sm text-text-muted text-right">{formatBytes(proc.memory)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}