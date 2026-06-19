import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  storage: {
    read: (fileName: string) => ipcRenderer.invoke('storage:read', fileName),
    write: (fileName: string, data: unknown) => ipcRenderer.invoke('storage:write', fileName, data),
    delete: (fileName: string) => ipcRenderer.invoke('storage:delete', fileName),
  },
  secrets: {
    encrypt: (value: string) => ipcRenderer.invoke('secret:encrypt', value),
    decrypt: (encryptedValue: string, encoding: string) => ipcRenderer.invoke('secret:decrypt', encryptedValue, encoding),
  },
  theme: {
    setSource: (themeMode: string) => ipcRenderer.invoke('theme:set-source', themeMode),
  },
});
