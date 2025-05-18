import { ipcMain } from 'electron';
import { spawn } from 'node:child_process';

export default () => {
  ipcMain.handle('solver:run', () => runSolver);
};

const PROCESS_TIMEOUT_MS = 1_000_000;

const runSolver = () => {
  const payload = {
    vehicleGroups: [],
    balloons: [
      {
        id: 'B1',
        capacity: 3,
        allowed_operators: ['pilotA', 'pilotB'],
        max_weight: 250,
      },
      {
        id: 'B2',
        capacity: 4,
        allowed_operators: ['pilotC'],
        max_weight: 350,
      },
    ],
    cars: [{ id: 'C1', capacity: 4, allowed_operators: ['driverA', 'pilotA'] }],
    people: [
      { id: 'pilotA', flights: 10, nationality: 'DE', weight: 80 },
      { id: 'pilotB', flights: 5, nationality: 'DE', weight: 75 },
      { id: 'pilotC', flights: 0, nationality: 'FR', weight: 78 },
      { id: 'driverA', flights: 1, nationality: 'FR', weight: 85 },
      { id: 'p1', flights: 2, nationality: 'DE', weight: 70 },
      { id: 'p2', flights: 0, nationality: 'FR', weight: 68 },
      { id: 'p3', flights: 3, nationality: 'DE', weight: 90 },
      { id: 'p4', flights: 4, nationality: 'DE', weight: 65 },
    ],
    history: {},
  };
  const json = JSON.stringify(payload);

  const root = 'C:\\Users\\Marvi\\PycharmProjects\\BalloonSolver\\';
  const venv = root + 'venv\\'; // or whatever your env is called
  const python = venv + 'Scripts\\python.exe';
  const scriptName = 'run_balloon_solver.py';

  return new Promise((resolve, reject) => {
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
        const json = JSON.parse(buffer);

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
