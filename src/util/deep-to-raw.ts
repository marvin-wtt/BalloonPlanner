import { toRaw, isRef, isReactive, isProxy } from 'vue';

// See https://github.com/vuejs/core/issues/5303#issuecomment-1543596383
export function deepToRaw<T>(sourceObj: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectIterator = (input: any): any => {
    if (Array.isArray(input)) {
      return input.map((item) => objectIterator(item));
    }
    if (isRef(input) || isReactive(input) || isProxy(input)) {
      return objectIterator(toRaw(input));
    }
    if (input && typeof input === 'object') {
      return Object.keys(input).reduce((acc, key) => {
        acc[key as keyof typeof acc] = objectIterator(input[key]);
        return acc;
      }, {} as T);
    }
    return input;
  };

  return objectIterator(sourceObj);
}
