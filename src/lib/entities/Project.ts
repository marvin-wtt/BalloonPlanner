import { Flight, User } from 'src/lib/entities';
import { Identifiable } from 'src/lib/utils/Identifiable';

export class Project extends Identifiable {
  private _flights: Flight[];
  private _name: string;
  private _description: string;
  private _collaborators: string[];
  private _local: boolean;
  private _path?: string;

  constructor(
    name: string,
    description?: string,
    flights?: Flight[],
    collaborators?: string[],
    local?: boolean
  ) {
    super();
    this._flights = flights ?? [];
    this._name = name;
    this._description = description ?? '';
    this._collaborators = collaborators ?? [];
    this._local = local ?? true;
  }

  get flights(): Flight[] {
    return this._flights;
  }

  getFlight(flightId: string) {
    return this._flights.filter((flight) => flight.id == flightId).at(0);
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get collaborators(): string[] {
    return this._collaborators;
  }

  get local(): boolean {
    return this._local;
  }

  set local(value: boolean) {
    this._local = value;
  }

  get path(): string | undefined {
    return this._path;
  }

  set path(value: string | undefined) {
    this._path = value;
  }
}
