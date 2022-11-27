import { Project } from 'src/lib/entities/Project';

export interface InputLoader {
  load(project: Project): Promise<Project>;
}
