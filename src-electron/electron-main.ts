import { app, BrowserWindow } from 'electron';
import initAppApiHandler from '@/../src-electron/appAPI/main';
import initWindowApiHandler from '@/../src-electron/windowAPI/main';
import initProjectApiHandler from '@/../src-electron/projectsAPI/main';
import initSolverApiHandler from '@/../src-electron/solverAPI/main';
import path from 'path';
import os from 'os';
import log from 'electron-log';
import {
  registerQuasarRuntime,
  resolveElectronAssetsPath,
} from '#q-app/electron/main';

// needed in case process is undefined under Linux
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const platform = process.platform || os.platform();

log.initialize();

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  log.error(
    'Failed to start application: Another instance seems to be already running.',
  );
  app.quit();
} else {
  app.on('second-instance', () => {
    log.info('Application is already running, restoring window.');

    const mainWindow = BrowserWindow.getAllWindows().find(
      (win) => !win.isDestroyed(),
    );
    mainWindow?.restore();
    mainWindow?.focus();
  });

  async function createWindow() {
    /**
     * Initial window options
     */
    const mainWindow = new BrowserWindow({
      icon: resolveElectronAssetsPath('icons/icon.png'), // tray icon
      width: 1000,
      height: 600,
      useContentSize: true,
      frame: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        preload: path.join(import.meta.dirname, 'electron-preload.cjs'),
      },
    });

    if (import.meta.env.QUASAR_DEV) {
      await mainWindow.loadURL(import.meta.env.QUASAR_APP_URL);
    } else {
      await mainWindow.loadFile('index.html');
    }

    if (import.meta.env.QUASAR_DEBUG) {
      // if on DEV or Production with debug enabled
      mainWindow.webContents.openDevTools();
    } else {
      // we're on production; no access to devtools pls
      mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.closeDevTools();
      });
    }

    // Disable CORS
    const URL = mainWindow.webContents.getURL();
    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'access-control-allow-origin': ['*'],
            'content-security-policy': `Content-Security-Policy: default-src 'self'; img-src 'self' ${URL}`,
          },
        });
      },
    );
  }

  app
    .whenReady()
    .then(registerQuasarRuntime)
    .then(initWindowApiHandler)
    .then(initAppApiHandler)
    .then(initProjectApiHandler)
    .then(initSolverApiHandler)
    .then(createWindow)
    .catch((reason: unknown) => {
      console.error(`Failed to start application: ${String(reason)}`);
    });

  app.on('window-all-closed', () => {
    if (platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((reason: unknown) => {
        console.error(`Failed to create window: ${String(reason)}`);
      });
    }
  });
}
