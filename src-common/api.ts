import type { Project, ProjectMeta } from 'app/src-common/entities';

export interface ProjectsAPI {
  index: () => Promise<ProjectMeta[]>;
  show: (id: string) => Promise<Project>;
  store: (project: Project) => Promise<void>;
  update: (project: Project) => Promise<void>;
  destroy: (id: string) => Promise<void>;
}

export interface SolverAPI {
  solveFlight: (project: Project, fightId: string) => Promise<Project>;
}

export interface WindowAPI {
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
  openDevTools: () => void;
}
