import type {
  Project,
  ProjectMeta,
  SmartFillPayload,
  VehicleGroup,
} from 'app/src-common/entities';

export interface ProjectsAPI {
  index: () => Promise<ProjectMeta[]>;
  show: (id: string) => Promise<Project>;
  store: (project: Project) => Promise<void>;
  update: (project: Project) => Promise<void>;
  destroy: (id: string) => Promise<void>;
}

export interface SolverAPI {
  solveFlight: (data: SmartFillPayload) => Promise<VehicleGroup[]>;
}

export interface WindowAPI {
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
  openDevTools: () => void;
}
