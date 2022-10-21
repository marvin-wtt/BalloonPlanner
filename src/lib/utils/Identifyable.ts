import { v4 as uuidv4 } from 'uuid';

export abstract class Identifyable {
  private _id: string;

  constructor(id?: string) {
    this._id = id ?? uuidv4();
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }
}
