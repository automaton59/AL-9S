import { app, BrowserWindow, Menu, ipcMain, nativeTheme, safeStorage } from 'electron';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const shouldOpenDevTools = process.env.OPEN_DEVTOOLS === '1' || process.env.OPEN_DEVTOOLS === 'true';
const ALLOWED_DATA_FILES = new Set(['config.json', 'chat-history.json', 'api-profiles.json']);

function getDataPath(fileName: string) {
  if (!ALLOWED_DATA_FILES.has(fileName)) {
    throw new Error(`Unsupported data file: ${fileName}`);
  }

  return path.join(app.getPath('userData'), 'data', fileName);
}

async function ensureDataDir() {
  await mkdir(path.join(app.getPath('userData'), 'data'), { recursive: true });
}

function registerStorageHandlers() {
  ipcMain.handle('storage:read', async (_event, fileName: string) => {
    await ensureDataDir();

    try {
      const content = await readFile(getDataPath(fileName), 'utf8');
      return JSON.parse(content);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  });

  ipcMain.handle('storage:write', async (_event, fileName: string, data: unknown) => {
    await ensureDataDir();
    await writeFile(getDataPath(fileName), JSON.stringify(data, null, 2), 'utf8');
    return true;
  });

  ipcMain.handle('storage:delete', async (_event, fileName: string) => {
    await ensureDataDir();
    await rm(getDataPath(fileName), { force: true });
    return true;
  });

  ipcMain.handle('secret:encrypt', (_event, value: string) => {
    if (!value) {
      return { encoding: 'plain:fallback', value: '' };
    }

    if (safeStorage.isEncryptionAvailable()) {
      try {
        return {
          encoding: 'safe:v1',
          value: safeStorage.encryptString(value).toString('base64'),
        };
      } catch {
        return { encoding: 'plain:fallback', value };
      }
    }

    return { encoding: 'plain:fallback', value };
  });

  ipcMain.handle('secret:decrypt', (_event, encryptedValue: string, encoding: string) => {
    if (!encryptedValue) {
      return '';
    }

    if (encoding === 'safe:v1') {
      try {
        return safeStorage.decryptString(Buffer.from(encryptedValue, 'base64'));
      } catch {
        return '';
      }
    }

    return encryptedValue;
  });

  ipcMain.handle('theme:set-source', (_event, themeMode: string) => {
    nativeTheme.themeSource = themeMode === 'light' || themeMode === 'dark'
      ? themeMode
      : 'system';
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://127.0.0.1:5173');
    if (shouldOpenDevTools) {
      win.webContents.openDevTools();
    }
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

registerStorageHandlers();

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

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
