import { app, BrowserWindow, ipcMain, shell, protocol } from 'electron';
import * as path from 'path';
import { setupFilesystemHandlers } from './ipc/filesystem';
import { setupTerminalHandlers } from './ipc/terminal';
import { setupDatabaseHandlers } from './ipc/database';
import { setupSystemHandlers } from './ipc/system';
import { setupAIHandlers } from './ipc/ai';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';
const DIST_PATH = path.join(__dirname, '../../frontend/dist');
const PRELOAD_PATH = path.join(__dirname, '../preload/preload.js');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'AI Operating System',
    icon: path.join(__dirname, '../../public/logo.png'),
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#FFFBE9',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(DIST_PATH, 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('local', (request, callback) => {
    const filePath = request.url.replace('local://', '');
    callback({ path: path.normalize(filePath) });
  });

  createWindow();

  setupFilesystemHandlers();
  setupTerminalHandlers();
  setupDatabaseHandlers();
  setupSystemHandlers();
  setupAIHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:path', (_, name: string) => app.getPath(name as any));
ipcMain.handle('app:show-in-folder', (_, filePath: string) => shell.showItemInFolder(filePath));
ipcMain.handle('app:open-path', (_, filePath: string) => shell.openPath(filePath));
ipcMain.handle('system:open-external', (_, url: string) => shell.openExternal(url));

export { mainWindow };