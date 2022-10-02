import { Identifyable } from 'src/lib/utils/Identifyable';

export function shuffle<Type>(a: Array<Type>): Array<Type> {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function removeFromArray<Type extends Identifyable>(
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
