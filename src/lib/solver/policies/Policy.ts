import { Flight } from 'src/lib/entities';

abstract class Policy {
  private _scoreMultiplier = 1;

  get scoreMultiplier(): number {
    return this._scoreMultiplier;
  }

  set scoreMultiplier(value: number) {
    this._scoreMultiplier = value;
  }

  abstract name(): string;

  abstract apply(flight: Flight): boolean | number;
}

export { Policy };
