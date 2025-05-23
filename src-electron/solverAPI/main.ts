import { ipcMain, type IpcMainEvent } from 'electron';
import { spawn } from 'node:child_process';
import type { SmartFillPayload, VehicleGroup } from 'app/src-common/entities';
import { fileURLToPath } from 'node:url';
import path from 'path';

export default () => {
  ipcMain.handle('solver:run', handleEvent(runSolver));
};

const handleEvent = (next: (...args: unknown[]) => Promise<unknown>) => {
  return (_event: IpcMainEvent, ...args: unknown[]) => {
    return next(...args);
  };
};

const PROCESS_TIMEOUT_MS = 1_000_000;
const SCRIPT_NAME = 'run_balloon_solver';

const spawnArgs = (): [string, string[]] => {
  if (process.env.DEV) {
    const currentDir = fileURLToPath(new URL('.', import.meta.url));
    const rootDir = path.join(currentDir, '..', '..', 'src-python');
    const python = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
    const script = path.join(rootDir, SCRIPT_NAME + '.py');

    return [python, [script, '--stdin']];
  }

  const execName =
    process.platform === 'win32' ? SCRIPT_NAME + '.exe' : SCRIPT_NAME;

  const executable = path.join(process.resourcesPath, 'python-bin', execName);
  return [executable, ['--stdin']];
};

const runSolver = (payload: SmartFillPayload): Promise<VehicleGroup[]> => {
  const json = JSON.stringify(payload);

  const process = spawn(...spawnArgs());

  process.stdin.write(json);
  process.stdin.end();

  let buffer = '';
  process.stdout.setEncoding('utf8');
  process.stdout.on('data', (chunk) => (buffer += chunk));

  let error = '';
  process.stderr.setEncoding('utf8');
  process.stderr.on('data', (chunk) => (error += chunk));

  return new Promise<VehicleGroup[]>((resolve, reject) => {
    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error('Timeout'));
    }, PROCESS_TIMEOUT_MS);

    process.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}:\n${error}`));
        return;
      }

      try {
        const json = JSON.parse(buffer);

        if (!Array.isArray(json)) {
          reject(new Error('Invalid JSON'));
          return;
        }

        resolve(json);
      } catch (e) {
        reject(new Error(e));
      }
    });
  });
};
