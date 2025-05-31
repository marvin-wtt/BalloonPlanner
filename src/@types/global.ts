import type {
  WindowAPI,
  ProjectsAPI,
  SolverAPI,
  AppAPI,
} from 'app/src-common/api';

declare global {
  interface Window {
    appAPI: AppAPI;
    windowAPI: WindowAPI;
    projectAPI: ProjectsAPI;
    solverAPI: SolverAPI;
  }
}
