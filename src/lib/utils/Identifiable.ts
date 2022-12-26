export abstract class Identifiable {
  private _id: string;

  static generateNewId(): string {
    return crypto.randomUUID();
  }

  protected constructor(id?: string) {
    this._id = id ?? Identifiable.generateNewId();
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }
}
