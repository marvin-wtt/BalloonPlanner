import { Project } from 'src/lib/entities/Project';
import { Flight } from 'src/lib/entities/Flight';

export abstract class GerneralSolver {
  private _project: Project;

  constructor(project: Project) {
    this._project = project;
  }

  protected get project(): Project {
    return this._project;
  }

  abstract solve(flight: Flight): Flight | null;
}
