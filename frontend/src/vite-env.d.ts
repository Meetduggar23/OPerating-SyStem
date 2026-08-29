/// <reference types="vite/client" />

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  import React from 'react';
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

interface Window {
  electronAPI: {
    fs: {
      readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      deleteFile: (path: string) => Promise<{ success: boolean; error?: string }>;
      mkdir: (path: string) => Promise<{ success: boolean; error?: string }>;
      readdir: (path: string) => Promise<{ success: boolean; entries?: Array<{ name: string; isDirectory: boolean; isFile: boolean }>; error?: string }>;
      stat: (path: string) => Promise<{ success: boolean; stats?: { size: number; isDirectory: boolean; isFile: boolean; mtime: number; ctime: number }; error?: string }>;
      copyFile: (src: string, dest: string) => Promise<{ success: boolean; error?: string }>;
      rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
      exists: (path: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
      getHomeDir: () => Promise<string>;
      getDesktopDir: () => Promise<string>;
      getDocumentsDir: () => Promise<string>;
      getDownloadsDir: () => Promise<string>;
    };
    terminal: {
      exec: (command: string, cwd: string) => Promise<{ success: boolean; output?: string; error?: string; exitCode?: number }>;
      getShell: () => Promise<string>;
    };
    db: {
      query: (sql: string, params?: unknown[]) => Promise<{ success: boolean; rows?: unknown[]; error?: string }>;
      execute: (sql: string, params?: unknown[]) => Promise<{ success: boolean; changes?: number; lastInsertRowid?: number; error?: string }>;
      migrate: () => Promise<{ success: boolean; error?: string }>;
      seed: () => Promise<{ success: boolean; error?: string }>;
    };
    system: {
      getInfo: () => Promise<{ success: boolean; info?: SystemInfo; error?: string }>;
      getProcesses: () => Promise<{ success: boolean; processes?: ProcessInfo[]; error?: string }>;
      getCpuUsage: () => Promise<{ success: boolean; usage?: number; error?: string }>;
      getMemoryUsage: () => Promise<{ success: boolean; usage?: { total: number; free: number; used: number }; error?: string }>;
      getDiskUsage: () => Promise<{ success: boolean; usage?: { total: number; free: number; used: number }; error?: string }>;
      restart: () => Promise<{ success: boolean; error?: string }>;
      shutdown: () => Promise<{ success: boolean; error?: string }>;
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
    };
    ai: {
      checkOllama: () => Promise<{ success: boolean; available?: boolean; models?: string[]; error?: string }>;
      chat: (messages: ChatMessage[], model: string) => Promise<{ success: boolean; response?: string; error?: string }>;
      streamChat: (messages: ChatMessage[], model: string) => AsyncGenerator<{ chunk: string; done: boolean }>;
    };
    app: {
      getVersion: () => Promise<string>;
      getPath: (name: string) => Promise<string>;
      showItemInFolder: (path: string) => Promise<void>;
      openPath: (path: string) => Promise<{ success: boolean; error?: string }>;
    };
    on: (channel: string, callback: (...args: unknown[]) => void) => void;
    off: (channel: string, callback: (...args: unknown[]) => void) => void;
  };
}

interface SystemInfo {
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  hostname: string;
  osVersion: string;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
}

interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}