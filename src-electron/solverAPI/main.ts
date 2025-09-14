import { ipcMain, type IpcMainEvent } from 'electron';
import { spawn } from 'node:child_process';
import type { SmartFillOptions, VehicleGroup } from 'app/src-common/entities';
import { fileURLToPath } from 'node:url';
import path from 'path';
import log from 'electron-log';
import type {
  BuildGroupsRequest,
  SolveLegRequest,
} from 'app/src-common/api/solver.api';

const PROCESS_TIMEOUT_MS = 1_000_000;
const SCRIPT_BASE = 'run_balloon_solver';

export default () => {
  ipcMain.handle(
    'solve:vehicle-groups',
    (_evt: IpcMainEvent, request: BuildGroupsRequest) =>
      runVehicleGroupSolver(request),
  );
  ipcMain.handle(
    'solve:flight-leg',
    (
      _evt: IpcMainEvent,
      request: SolveLegRequest,
      options?: SmartFillOptions,
    ) => runSolver(payload, options),
  );
};

function runVehicleGroupSolver(request: BuildGroupsRequest): Promise<unknown> {
  // TODO
}

function runSolver(
  request: SolveLegRequest,
  options?: SmartFillOptions,
): Promise<VehicleGroup[]> {
  const [cmd, baseArgs] = spawnArgs();
  const args = [...baseArgs, ...buildFlagArgs(options)];
  const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

  // send input
  proc.stdin.write(JSON.stringify(request));
  proc.stdin.end();

  let stdoutData = '';
  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', (chunk: string) => {
    stdoutData += chunk;
  });

  let stderrData = '';
  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', (chunk: string) => {
    stderrData += chunk;
  });

  return new Promise<VehicleGroup[]>((resolve, reject) => {
    const timeout = setTimeout(() => {
      proc.kill();
      log.error('Solver timeout', {
        payload: request,
        timeout: PROCESS_TIMEOUT_MS,
      });
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

      if (!code) {
        reject(new Error('The solver process exited unexpectedly.'));
        return;
      }

      if (code !== 0) {
        reject(handleError(code, stderrData));
        return;
      }

      try {
        const data = JSON.parse(stdoutData);
        if (!Array.isArray(data)) {
          log.error('Invalid solver output', data);
          reject(new Error('Invalid solver output'));
          return;
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
  if (opts.wNoSoloParticipant != null) {
    args.push('--w-no-solo-participant', String(opts.wNoSoloParticipant));
  }
  if (opts.wClusterPassengerBalance != null) {
    args.push(
      '--w-cluster-passenger-balance',
      String(opts.wClusterPassengerBalance),
    );
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
  if (opts.wSecondLegOverweight != null) {
    args.push('--w-second-leg-overweight', String(opts.wSecondLegOverweight));
  }
  if (opts.counselorFlightDiscount != null) {
    args.push(
      '--counselor-flight-discount',
      String(opts.counselorFlightDiscount),
    );
  }
  if (opts.timeLimit != null) {
    args.push('--time-limit', String(opts.timeLimit));
  }
  if (opts.defaultPersonWeight != null) {
    args.push('--default-person-weight', String(opts.defaultPersonWeight));
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
    `Solver exited with code ${code.toString()} but no structured error.`,
    stderrData,
  );
  return new Error('An unexpected error occurred in the solver.');
}
