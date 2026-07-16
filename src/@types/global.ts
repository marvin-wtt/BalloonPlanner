import type {
  WindowAPI,
  ProjectsAPI,
  SolverAPI,
  AppAPI,
} from '@/../src-common/api';

declare global {
  interface Window {
    appAPI: AppAPI;
    windowAPI: WindowAPI;
    projectAPI: ProjectsAPI;
    solverAPI: SolverAPI;
  }
}
