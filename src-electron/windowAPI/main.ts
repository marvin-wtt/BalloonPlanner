import { type IpcMainEvent, BrowserWindow, ipcMain } from 'electron';

export default () => {
  ipcMain.on('window:close', windowApiHandler.close);
  ipcMain.on('window:minimize', windowApiHandler.minimize);
  ipcMain.on('window:toggle-maximize', windowApiHandler.toggleMaximize);
  ipcMain.on('window:open-dev-tools', windowApiHandler.openDevTools);
};

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
  }),

  openDevTools: windowEventWrapper((win: BrowserWindow) => {
    win.webContents.openDevTools();
  }),
};
