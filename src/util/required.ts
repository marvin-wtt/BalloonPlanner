export function required<T>(value: T): Exclude<T, null | undefined> {
  if (value === null || value === undefined) {
    throw new Error('Value is required.');
  }

  return value as Exclude<T, null | undefined>;
}
