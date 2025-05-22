import type { WindowAPI, ProjectsAPI, SolverAPI } from 'app/src-common/api';

declare global {
  interface Window {
    windowAPI: WindowAPI;
    projectAPI: ProjectsAPI;
    solverAPI: SolverAPI;
  }
}
