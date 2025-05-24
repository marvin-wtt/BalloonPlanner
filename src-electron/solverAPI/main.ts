import { ipcMain, type IpcMainEvent } from 'electron';
import { spawn } from 'node:child_process';
import type {
  SmartFillPayload,
  SmartFillOptions,
  VehicleGroup,
} from 'app/src-common/entities';
import { fileURLToPath } from 'node:url';
import path from 'path';
import log from 'electron-log';

const PROCESS_TIMEOUT_MS = 1_000_000;
const SCRIPT_BASE = 'run_balloon_solver';

export default () => {
  ipcMain.handle(
    'solver:run',
    (
      _evt: IpcMainEvent,
      payload: SmartFillPayload,
      options?: SmartFillOptions,
    ) => runSolver(payload, options),
  );
};

function runSolver(
  payload: SmartFillPayload,
  options?: SmartFillOptions,
): Promise<VehicleGroup[]> {
  const [cmd, baseArgs] = spawnArgs();
  const args = [...baseArgs, ...buildFlagArgs(options)];
  const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

  // send input
  proc.stdin.write(JSON.stringify(payload));
  proc.stdin.end();

  let stdoutData = '';
  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', (chunk) => {
    stdoutData += chunk;
  });

  let stderrData = '';
  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', (chunk) => {
    stderrData += chunk;
  });

  return new Promise<VehicleGroup[]>((resolve, reject) => {
    const timeout = setTimeout(() => {
      proc.kill();
      log.error('Solver timeout', { payload, timeout: PROCESS_TIMEOUT_MS });
      reject(
        new Error('The solver took too long to respond. Please try again.'),
      );
    }, PROCESS_TIMEOUT_MS);

    proc.on('error', (err) => {
      clearTimeout(timeout);
      log.error('Spawn error', err);
      reject(new Error('Could not start the solver process.'));
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        return reject(handleError(code, stderrData));
      }

      try {
        const data = JSON.parse(stdoutData);
        if (!Array.isArray(data)) {
          log.error('Invalid solver output', data);
          return reject(new Error('Invalid solver output'));
        }
        resolve(data as VehicleGroup[]);
      } catch (e) {
        log.error('Failed to parse solver output', e);
        reject(new Error(`Invalid solver response`));
      }
    });
  });
}

function spawnArgs(): [string, string[]] {
  if (process.env.DEV) {
    // In dev, run from a local Python venv
    const cwd = fileURLToPath(new URL('.', import.meta.url));
    const srcPy = path.join(cwd, '..', '..', 'src-python');
    const pythonBin =
      process.platform === 'win32'
        ? path.join(srcPy, '.venv', 'Scripts', 'python.exe')
        : path.join(srcPy, '.venv', 'bin', 'python');
    const scriptPath = path.join(srcPy, SCRIPT_BASE + '.py');

    return [pythonBin, [scriptPath]];
  }

  // In production, run the bundled exe (Windows) or binary
  const execName =
    process.platform === 'win32' ? SCRIPT_BASE + '.exe' : SCRIPT_BASE;
  const binPath = path.join(process.resourcesPath, 'python-bin', execName);
  return [binPath, []];
}

function buildFlagArgs(opts?: SmartFillOptions): string[] {
  const args: string[] = [];
  if (!opts) {
    return args;
  }

  if (opts.wPilotFairness != null) {
    args.push('--w-pilot-fairness', String(opts.wPilotFairness));
  }
  if (opts.wPassengerFairness != null) {
    args.push('--w-passenger-fairness', String(opts.wPassengerFairness));
  }
  if (opts.wNationalityDiversity != null) {
    args.push('--w-nationality-diversity', String(opts.wNationalityDiversity));
  }
  if (opts.wVehicleRotation != null) {
    args.push('--w-vehicle-rotation', String(opts.wVehicleRotation));
  }
  if (opts.wSecondLegFairness != null) {
    args.push('--w-second-leg', String(opts.wSecondLegFairness));
  }
  if (opts.timeLimit != null) {
    args.push('--time-limit', String(opts.timeLimit));
  }
  if (opts.leg != null) {
    args.push('--flight-leg', opts.leg === 'first' ? '1' : '2');
  }

  return args;
}

function handleError(code: number, stderrData: string): Error {
  let errorData: unknown;
  try {
    errorData = JSON.parse(stderrData);
  } catch {
    // ignore
  }

  if (
    typeof errorData === 'object' &&
    errorData != null &&
    'message' in errorData &&
    typeof errorData.message === 'string'
  ) {
    log.error('Solver error', { data: errorData, stderr: stderrData });

    return new Error(errorData.message);
  }

  log.error(
    `Solver exited with code ${code} but no structured error.`,
    stderrData,
  );
  return new Error('An unexpected error occurred in the solver.');
}
