import { ipcRenderer } from 'electron';
import type { SolverAPI } from '@/../src-common/api';

const api: SolverAPI = {
  solveFlightLeg: (...args: unknown[]) =>
    ipcRenderer.invoke('solve:flight-leg', ...args),
  solveVehicleGroups: (...args: unknown[]) =>
    ipcRenderer.invoke('solve:vehicle-groups', ...args),
};

export default api;
