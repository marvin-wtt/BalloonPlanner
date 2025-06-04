import type { Person } from 'app/src-common/entities';
import { readJsonFile } from 'src/util/json-file-reader';
import { makeUniqueNames } from 'src/util/unique-name';

/**
 * Reads a JSON file, unwraps nested `data` properties, validates
 * and normalizes person records, and assigns unique display names.
 */

export async function loadJsonFile(
  file: File,
): Promise<Pick<Person, 'id' | 'name' | 'role' | 'nationality'>[]> {
  const data = await readJsonFile(file);

  return loadJson(data);
}

export function loadJson(
  data: unknown,
): Pick<Person, 'id' | 'name' | 'role' | 'nationality'>[] {
  const unwrapped = unwrapData(data);

  if (!Array.isArray(unwrapped)) {
    throw new Error('Expected top-level array of person records');
  }

  // Normalize and validate each entry
  const normalized = unwrapped
    .filter((entry) => !entry.waitingList)
    .map((entry, idx) => {
      const personData = unwrapComputed(entry);

      if (!isValidPersonData(personData)) {
        throw new Error(`Invalid person record at index ${idx}`);
      }

      const { firstName, lastName, address, role } = personData;

      return {
        firstName,
        lastName,
        role: normalizeRole(role),
        nationality: address.country.toLowerCase(),
      };
    });

  const unique = makeUniqueNames(normalized);
  return unique.map(({ name, role, nationality }) => ({
    id: crypto.randomUUID(),
    name,
    role,
    nationality,
  }));
}

/** Unwrap nested `data` properties if present. */
function unwrapData(input: unknown): unknown {
  if (isObject(input) && 'data' in input) {
    return input.data;
  }
  return input;
}

/** If `computedData` exists and is object, return it; otherwise return raw. */
function unwrapComputed(entry: unknown): unknown {
  if (
    isObject(entry) &&
    'computedData' in entry &&
    isObject(entry.computedData)
  ) {
    return entry.computedData;
  }
  return entry;
}

/** Runtime check for a plain object. */
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/** Type guard verifying all required person properties and types. */
function isValidPersonData(x: unknown): x is {
  firstName: string;
  lastName: string;
  address: { country: string };
  role: string;
} {
  if (!isObject(x)) return false;
  const { firstName, lastName, address, role } = x;
  if (typeof firstName !== 'string' || firstName.trim() === '') return false;
  if (typeof lastName !== 'string' || lastName.trim() === '') return false;
  if (!isObject(address)) return false;
  const country = address.country;
  if (typeof country !== 'string' || country.length !== 2) return false;
  return !(typeof role !== 'string' || role.trim() === '');
}

/** Normalize role values. */
function normalizeRole(role: string): Person['role'] {
  return role === 'participant' ? 'participant' : 'counselor';
}
