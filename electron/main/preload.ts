import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  fs: {
    readFile: (path: string) => ipcRenderer.invoke('fs:read', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:write', path, content),
    deleteFile: (path: string) => ipcRenderer.invoke('fs:delete', path),
    mkdir: (path: string) => ipcRenderer.invoke('fs:mkdir', path),
    readdir: (path: string) => ipcRenderer.invoke('fs:readdir', path),
    stat: (path: string) => ipcRenderer.invoke('fs:stat', path),
    copyFile: (src: string, dest: string) => ipcRenderer.invoke('fs:copy', src, dest),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
    getHomeDir: () => ipcRenderer.invoke('fs:home-dir'),
    getDesktopDir: () => ipcRenderer.invoke('fs:desktop-dir'),
    getDocumentsDir: () => ipcRenderer.invoke('fs:documents-dir'),
    getDownloadsDir: () => ipcRenderer.invoke('fs:downloads-dir'),
  },
  terminal: {
    exec: (command: string, cwd: string) => ipcRenderer.invoke('terminal:exec', command, cwd),
    getShell: () => ipcRenderer.invoke('terminal:shell'),
  },
  db: {
    query: (sql: string, params?: unknown[]) => ipcRenderer.invoke('db:query', sql, params),
    execute: (sql: string, params?: unknown[]) => ipcRenderer.invoke('db:execute', sql, params),
    migrate: () => ipcRenderer.invoke('db:migrate'),
    seed: () => ipcRenderer.invoke('db:seed'),
  },
  system: {
    getInfo: () => ipcRenderer.invoke('system:info'),
    getProcesses: () => ipcRenderer.invoke('system:processes'),
    getCpuUsage: () => ipcRenderer.invoke('system:cpu'),
    getMemoryUsage: () => ipcRenderer.invoke('system:memory'),
    getDiskUsage: () => ipcRenderer.invoke('system:disk'),
    restart: () => ipcRenderer.invoke('system:restart'),
    shutdown: () => ipcRenderer.invoke('system:shutdown'),
    openExternal: (url: string) => ipcRenderer.invoke('system:open-external', url),
  },
  ai: {
    checkOllama: () => ipcRenderer.invoke('ai:check-ollama'),
    chat: (messages: unknown[], model: string) => ipcRenderer.invoke('ai:chat', messages, model),
    streamChat: async function* (messages: unknown[], model: string) {
      const id = ipcRenderer.invoke('ai:stream-chat', messages, model);
      // For simplicity, use regular chat in preload
      const result = await ipcRenderer.invoke('ai:chat', messages, model);
      yield { chunk: result.response || '', done: true };
    },
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
    getPath: (name: string) => ipcRenderer.invoke('app:path', name),
    showItemInFolder: (path: string) => ipcRenderer.invoke('app:show-in-folder', path),
    openPath: (path: string) => ipcRenderer.invoke('app:open-path', path),
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
});