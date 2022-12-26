import { Identifiable } from 'src/lib/utils/Identifiable';

export { shuffle, swap, removeFromArray, permutations };

function shuffle<Type>(a: Array<Type>): Array<Type> {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function removeFromArray<Type extends Identifiable>(
  a: Array<Type>,
  e: Type
): boolean {
  const i = a.findIndex((value) => value.id === e.id);
  if (i === -1) {
    return false;
  }
  a.splice(i, 1);
  return true;
}

function sjt<T>(arr: T[]) {
  const N = arr.length;
  const directions: number[] = [];
  const indices: number[] = [];

  directions.push(0);
  indices.push(0);
  for (let i = 1; i < N; i += 1) {
    directions.push(-1);
    indices.push(i);
  }

  function swap(i: number, j: number) {
    let tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;

    tmp = directions[i];
    directions[i] = directions[j];
    directions[j] = tmp;
  }

  function result(): T[] {
    const res: T[] = [];
    for (let i = 0; i < N; i += 1) {
      res.push(arr[indices[i]]);
    }
    return res;
  }

  return (): T[] | undefined => {
    let maxIndex;
    for (let i = 0; i < N; i += 1) {
      if (directions[i] !== 0) {
        maxIndex = i;
        break;
      }
    }
    if (maxIndex === undefined) {
      return undefined;
    }
    for (let i = maxIndex + 1; i < N; i += 1) {
      if (directions[i] !== 0 && indices[i] > indices[maxIndex]) {
        maxIndex = i;
      }
    }
    const moveTo = maxIndex + directions[maxIndex];
    swap(maxIndex, moveTo);
    if (
      moveTo === 0 ||
      moveTo === N - 1 ||
      indices[moveTo + directions[moveTo]] > indices[moveTo]
    ) {
      directions[moveTo] = 0;
    }
    for (let i = 0; i < N; i += 1) {
      if (indices[i] > indices[moveTo]) {
        if (i < moveTo) {
          directions[i] = 1;
        } else {
          directions[i] = -1;
        }
      }
    }
    return result();
  };
}

function permutations<T>(array: T[]) {
  const generator = sjt<T>(array);

  let next: T[] | undefined = array;
  while (next !== undefined) {

    next = generator();
  }
}

// swap what is stored at position i and j in the array
function swap(array: number[] | string[], i: number, j: number) {
  const temp = array[i];
  array[i] = array[j];
  array[j] = temp;
}
