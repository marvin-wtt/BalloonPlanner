import type { Person } from 'app/src-common/entities';
import { readJsonFile } from 'src/util/json-file-reader';
import { makeUniqueNames } from 'src/util/unique-name';

/**
 * Reads a JSON file, unwraps nested `data` properties, validates
 * and normalizes person records, assigns unique display names,
 * and extracts spoken languages.
 */

export async function loadJsonFile(
  file: File,
): Promise<
  Pick<Person, 'id' | 'name' | 'role' | 'nationality' | 'languages'>[]
> {
  const data = await readJsonFile(file);
  return loadJson(data);
}

export function loadJson(
  data: unknown,
): Pick<Person, 'id' | 'name' | 'role' | 'nationality' | 'languages'>[] {
  const unwrapped = unwrapData(data);

  if (!Array.isArray(unwrapped)) {
    throw new Error('Expected top-level array of person records');
  }

  // Normalize and validate each entry
  const normalized = unwrapped
    .filter((entry) => !isObject(entry) || !entry.waitingList)
    .map((entry, i) => {
      const id =
        isObject(entry) && typeof entry.id === 'string'
          ? entry.id
          : crypto.randomUUID();

      const computedData = unwrapComputed(entry);

      if (!isValidPersonData(computedData)) {
        throw new Error(`Invalid person record at index ${i.toString()}`);
      }

      const { firstName, lastName, address, role } = computedData;

      return {
        id,
        firstName,
        lastName,
        role: normalizeRole(role),
        nationality: address.country.toLowerCase(),
        languages: extractLanguages(entry),
      };
    });

  const unique = makeUniqueNames(normalized);
  return unique.map(({ id, name, role, nationality, languages }) => ({
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    id: id ?? crypto.randomUUID(),
    name,
    role,
    nationality,
    languages,
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

/** Extract languages from various possible shapes on the entry. */
function extractLanguages(entry: unknown): string[] | undefined {
  const raw =
    // preferred: data.language_skills
    (isObject(entry) &&
    isObject(entry.data) &&
    isObject(entry.data.language_skills)
      ? entry.data.language_skills
      : undefined) ??
    // sometimes at top-level
    (isObject(entry) && isObject(entry.language_skills)
      ? entry.language_skills
      : undefined) ??
    // rarely under computedData
    (isObject(entry) &&
    isObject(entry.computedData) &&
    isObject(entry.computedData.language_skills)
      ? entry.computedData.language_skills
      : undefined);

  if (!isObject(raw)) return undefined;

  const result: string[] = [];
  for (const [lang, val] of Object.entries(raw)) {
    if (speaksEnough(val)) {
      result.push(lang.toLowerCase());
    }
  }
  // unique + stable order
  return Array.from(new Set(result)).sort();
}

/**
 * Decide if a language entry counts as "speaks enough":
 * - numbers: >= 1
 * - strings: >= "basic" (i.e., 'basic', 'intermediate', 'advanced', 'fluent', etc.)
 * - objects: check `.level` using same rules (string/number)
 */
function speaksEnough(v: unknown): boolean {
  // number value
  if (typeof v === 'number') return v >= 1;

  // string value (level)
  if (typeof v === 'string') return isLevelAtLeastIntermediate(v);

  // object value with { level: string | number }
  if (isObject(v) && 'level' in v) {
    const lvl = v.level;
    if (typeof lvl === 'number') return lvl >= 1;
    if (typeof lvl === 'string') return isLevelAtLeastIntermediate(lvl);
  }

  return false;
}

/** Heuristic check for textual levels that are >= basic. */
function isLevelAtLeastIntermediate(level: string): boolean {
  const s = level.trim().toLowerCase();

  // explicit "none"/empty => false
  if (!s || s === 'none' || s === 'no' || s === 'zero') return false;

  // accept common terms at/above "basic"
  // allow prefixes (e.g., "basics", "basic+", "intermediate (b1)")
  const levels = [
    //'a1',
    //'basic',
    //'elementary',
    //'a2',
    'intermediate',
    'upper',
    'b1',
    'b2',
    'advanced',
    'c1',
    'c2',
    'fluent',
    'native',
    'conversational',
  ] as const;

  if (levels.some((l) => s.startsWith(l))) {
    return true;
  }

  // sometimes numeric-in-string: "1", "2", etc.
  const n = Number(s);
  if (!Number.isNaN(n)) return n >= 1;

  return false;
}
