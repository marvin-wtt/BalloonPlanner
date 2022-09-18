import { Flight } from 'src/lib/entities/Flight';

export abstract class GerneralSolver {
  abstract solve(flight: Flight): Flight | null;
}
