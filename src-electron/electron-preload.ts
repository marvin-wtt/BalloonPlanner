/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */

import { contextBridge } from 'electron';
import windowAPI from './windowAPI/preload';
import appAPI from './appAPI/preload';
import solverAPI from './solverAPI/preload';
import projectAPI from './projectsAPI/preload';
import { ipcRenderer } from 'electron';

const originalInvoke = ipcRenderer.invoke.bind(ipcRenderer);

// Strip error prefix from error messages
ipcRenderer.invoke = async (channel: string, ...args: unknown[]) => {
  try {
    return await originalInvoke(channel, ...args);
  } catch (err: unknown) {
    // https://github.com/electron/electron/blob/b9b96a96f7f38393c6114c508124549d71b97fe8/lib/renderer/api/ipc-renderer.ts#L24
    const prefix = `Error invoking remote method '${channel}': Error:`;

    if (err instanceof Error && err.message.startsWith(prefix)) {
      throw new Error(err.message.slice(prefix.length));
    }

    throw err;
  }
};

contextBridge.exposeInMainWorld('windowAPI', windowAPI);
contextBridge.exposeInMainWorld('appAPI', appAPI);
contextBridge.exposeInMainWorld('solverAPI', solverAPI);
contextBridge.exposeInMainWorld('projectAPI', projectAPI);
