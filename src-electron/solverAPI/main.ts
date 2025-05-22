import { ipcMain, type IpcMainEvent } from 'electron';
import { spawn } from 'node:child_process';
import type { SmartFillPayload, VehicleGroup } from 'app/src-common/entities';

export default () => {
  ipcMain.handle('solver:run', handleEvent(runSolver));
};

const handleEvent = (next: (...args: unknown[]) => Promise<unknown>) => {
  return (_event: IpcMainEvent, ...args: unknown[]) => {
    return next(...args);
  };
};

const PROCESS_TIMEOUT_MS = 1_000_000;

const runSolver = (payload: SmartFillPayload): Promise<VehicleGroup[]> => {
  const json = JSON.stringify(payload);

  const root = 'C:\\Users\\Marvi\\PycharmProjects\\BalloonSolver\\';
  const venv = root + 'venv\\'; // or whatever your env is called
  const python = venv + 'Scripts\\python.exe';
  const scriptName = 'run_balloon_solver.py';

  console.log(json);

  return new Promise<VehicleGroup[]>((resolve, reject) => {
    const process = spawn(python, [root + scriptName, '--stdin']);

    process.stdin.write(json);
    process.stdin.end();

    let buffer = '';
    process.stdout.setEncoding('utf8');
    process.stdout.on('data', (chunk) => (buffer += chunk));

    let error = '';
    process.stderr.setEncoding('utf8');
    process.stderr.on('data', (chunk) => (error += chunk));

    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error('Timeout'));
    }, PROCESS_TIMEOUT_MS);

    process.on('close', (code) => {
      clearTimeout(timeout);

      try {
        console.log('Buffer:');
        console.log(buffer);

        const json = JSON.parse(buffer);

        if (!Array.isArray(json)) {
          reject(new Error('Invalid JSON'));
          return;
        }

        if (code === 0) {
          resolve(json);
        } else {
          reject(new Error(`Process exited with code ${code}:\n${error}`));
        }
      } catch (e) {
        reject(new Error(e));
      }
    });
  });
};
