import { app, BrowserWindow, IpcMainEvent, ipcMain } from 'electron';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

function createWindow() {
  /**
   * Initial window options
   */
  const mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    frame: false,
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
    }
  });

  if (process.env.DEV) {
    mainWindow.loadURL(process.env.APP_URL);
  } else {
    mainWindow.loadFile('index.html');
  }

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }
}

app.whenReady()
  .then(createWindow)
  .then(() => {
    ipcMain.on('window:close', windowApiHandler.close);
    ipcMain.on('window:minimize', windowApiHandler.minimize);
    ipcMain.on('window:toggle-maximize', windowApiHandler.toggleMaximize);

    ipcMain.on('solver:solve', (data: object) => {
      // TODO
    });
  });

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// -----------------------------------------------------------------------------
//  Window API
// -----------------------------------------------------------------------------
const windowEventWrapper = (next: (window: BrowserWindow) => void) => {
  return (event: IpcMainEvent) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);

    if (!win) {
      return;
    }

    next(win);
  };
};

const windowApiHandler = {
  minimize: windowEventWrapper((win: BrowserWindow) => {
    win.minimize();
  }),

  toggleMaximize: windowEventWrapper((win: BrowserWindow) => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }),

  close: windowEventWrapper((win: BrowserWindow) => {
    win.close();
  })
};
