import { type windowAPI } from '../../src-electron/electron-preload';

declare global {
  interface Window {
    windowAPI: typeof windowAPI;
  }
}
