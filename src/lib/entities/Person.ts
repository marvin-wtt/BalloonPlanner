import { Identifiable } from 'src/lib/utils/Identifiable';

export class Person extends Identifiable {
  private _name: string;
  private _numberOfFlights: number;
  private _nation: string;
  private _supervisor: boolean;
  private _firstTime: boolean;
  private _weight: number;

  constructor(
    name: string,
    nation: string,
    supervisor?: boolean,
    flights?: number,
    firstTime?: boolean,
    weight?: number
  ) {
    super();
    this._name = name;
    this._nation = nation;
    this._supervisor = supervisor ?? false;
    this._numberOfFlights = flights ?? 0;
    this._firstTime = firstTime ?? false;
    this._weight = weight ?? Number.MAX_VALUE;
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

  set firstTime(value: boolean) {
    this._firstTime = value;
  }

  get firstTime(): boolean {
    return this._firstTime;
  }

  get supervisor(): boolean {
    return this._supervisor;
  }

  set supervisor(value: boolean) {
    this._supervisor = value;
  }

  get weight(): number {
    return this._weight;
  }

  set weight(value: number) {
    this._weight = value;
  }

  incrementFlights() {
    this._numberOfFlights++;
  }

  decrementFlights() {
    this._numberOfFlights--;
  }
}
