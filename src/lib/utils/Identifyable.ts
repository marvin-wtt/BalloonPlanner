import { v4 as uuidv4 } from 'uuid';

export abstract class Identifyable {
  private _id: string;

  static generateNewId(): string {
    return uuidv4();
  }

  constructor(id?: string) {
    this._id = id ?? Identifyable.generateNewId();
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }
}
