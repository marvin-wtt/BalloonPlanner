import { Flight, User } from 'src/lib/entities';
import { Identifyable } from 'src/lib/utils/Identifyable';

export class Project extends Identifyable {
  private _flights: Flight[];
  private _name: string;
  private _desciption: string;
  private _collaborators: User[];
  private _local: boolean;
  private _path?: string;

  constructor(name: string, desciption?: string, flights?: Flight[], collaborators?: User[], local?: boolean) {
    super();
    this._flights = flights ?? [];
    this._name = name;
    this._desciption = desciption ?? '';
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

  get desciption(): string {
    return this._desciption;
  }

  get collaborators(): User[] {
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
