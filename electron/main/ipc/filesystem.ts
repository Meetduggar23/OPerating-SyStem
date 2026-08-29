import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function getHomeDir(): string {
  return os.homedir();
}

function expandPath(filePath: string): string {
  if (filePath === '~') return getHomeDir();
  if (filePath.startsWith('~/')) return path.join(getHomeDir(), filePath.slice(2));
  return filePath;
}

export function setupFilesystemHandlers() {
  ipcMain.handle('fs:read', async (_, filePath: string) => {
    try {
      const expanded = expandPath(filePath);
      const content = fs.readFileSync(expanded, 'utf-8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:write', async (_, filePath: string, content: string) => {
    try {
      const expanded = expandPath(filePath);
      const dir = path.dirname(expanded);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(expanded, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:delete', async (_, filePath: string) => {
    try {
      const expanded = expandPath(filePath);
      const stat = fs.statSync(expanded);
      if (stat.isDirectory()) {
        fs.rmSync(expanded, { recursive: true, force: true });
      } else {
        fs.unlinkSync(expanded);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:mkdir', async (_, dirPath: string) => {
    try {
      const expanded = expandPath(dirPath);
      fs.mkdirSync(expanded, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:readdir', async (_, dirPath: string) => {
    try {
      const expanded = expandPath(dirPath);
      const entries = fs.readdirSync(expanded, { withFileTypes: true });
      return {
        success: true,
        entries: entries.map((entry) => ({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          isSymbolicLink: entry.isSymbolicLink(),
        })),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:stat', async (_, filePath: string) => {
    try {
      const expanded = expandPath(filePath);
      const stat = fs.statSync(expanded);
      return {
        success: true,
        stats: {
          size: stat.size,
          isDirectory: stat.isDirectory(),
          isFile: stat.isFile(),
          isSymbolicLink: stat.isSymbolicLink(),
          mtime: stat.mtimeMs,
          ctime: stat.ctimeMs,
          atime: stat.atimeMs,
          mode: stat.mode,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:copy', async (_, src: string, dest: string) => {
    try {
      const expandedSrc = expandPath(src);
      const expandedDest = expandPath(dest);
      fs.copyFileSync(expandedSrc, expandedDest);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:rename', async (_, oldPath: string, newPath: string) => {
    try {
      const expandedOld = expandPath(oldPath);
      const expandedNew = expandPath(newPath);
      fs.renameSync(expandedOld, expandedNew);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:exists', async (_, filePath: string) => {
    try {
      const expanded = expandPath(filePath);
      const exists = fs.existsSync(expanded);
      return { success: true, exists };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:home-dir', () => getHomeDir());
  ipcMain.handle('fs:desktop-dir', () => path.join(getHomeDir(), 'Desktop'));
  ipcMain.handle('fs:documents-dir', () => path.join(getHomeDir(), 'Documents'));
  ipcMain.handle('fs:downloads-dir', () => path.join(getHomeDir(), 'Downloads'));
}