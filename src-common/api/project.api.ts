import type { Project, ProjectMeta } from 'app/src-common/entities';

export interface ProjectsAPI {
  index: () => Promise<ProjectMeta[]>;
  show: (id: string) => Promise<Project>;
  store: (project: Project) => Promise<void>;
  update: (project: Project) => Promise<void>;
  destroy: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  onOpenRequest: (callback: (meta: Project) => void) => void;
  openFile: () => void;
}
