export abstract class Identifyable {
  private static _ID_COUNTER = 0;
  private static _GENERATE_NEW_IDS = true;

  private _id: number;

  constructor(id?: number) {
    this._id = id ?? Identifyable._ID_COUNTER++;
  }

  static stopIdGeneration() {
    this._GENERATE_NEW_IDS = false;
  }

  static startIdGeneration() {
    this._GENERATE_NEW_IDS = true;
  }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    if (Identifyable._ID_COUNTER < value) {
      Identifyable._ID_COUNTER = value;
    }
    this._id = value;
  }
}

export function withoutIdGeneration(fn: () => void) {
  Identifyable.stopIdGeneration();
  fn();
  Identifyable.startIdGeneration();
}
