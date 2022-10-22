import { Identifyable } from 'src/lib/utils/Identifyable';
import { Cloneable } from 'src/lib/utils/Cloneable';

export class Person extends Identifyable {
  private _name: string;
  private _numberOfFlights: number;
  private _nation: string;
  private _supervisor: boolean;

  constructor(
    name: string,
    nation: string,
    supervisor?: boolean,
    flights?: number
  ) {
    super();
    this._name = name;
    this._nation = nation;
    this._supervisor = supervisor ?? false;
    this._numberOfFlights = flights ?? 0;
  }

  get nation(): string {
    return this._nation;
  }

  set nation(value: string) {
    this._nation = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get numberOfFlights(): number {
    return this._numberOfFlights;
  }

  set numberOfFlights(value: number) {
    this._numberOfFlights = value;
  }

  get supervisor(): boolean {
    return this._supervisor;
  }

  set supervisor(value: boolean) {
    this._supervisor = value;
  }

  incrementFlights() {
    this._numberOfFlights++;
  }

  decrementFlights() {
    this._numberOfFlights--;
  }
}
