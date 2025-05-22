import type { WindowAPI } from 'app/src-common/WindowAPI';
import type { ProjectsAPI } from 'app/src-common/ProjectsAPI';

declare global {
  interface Window {
    windowAPI: WindowAPI;
    projectAPI: ProjectsAPI;
  }
}
