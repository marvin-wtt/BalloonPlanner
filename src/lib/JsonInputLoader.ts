import type { Person } from 'app/src-common/entities';
import { readJsonFile } from 'src/util/json-file-reader';
import { makeUniqueNames } from 'src/util/unique-name';

export async function loadJson(file: File): Promise<Person[]> {
  let data = await readJsonFile(file);

  // Extra data wrap check in case of a response object
  if (
    'data' in data &&
    typeof data.data === 'object' &&
    Array.isArray(data.data)
  ) {
    data = data.data;
  }

  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON data.');
  }

  const people: {
    firstName: string;
    lastName: string;
    role: Person['role'];
    nationality: Person['nationality'];
  }[] = [];
  for (let personData of data) {
    // Computed data check in case it is a registration output
    if (
      'computedData' in personData &&
      typeof personData.computedData === 'object'
    ) {
      personData = personData.computedData;
    }

    if (
      !('firstName' in personData) ||
      typeof personData.firstName !== 'string'
    ) {
      throw new Error('Missing first name property.');
    }

    if (
      !('lastName' in personData) ||
      typeof personData.lastName !== 'string'
    ) {
      throw new Error('Missing last name property.');
    }

    if (
      !('address' in personData) ||
      typeof personData.address !== 'object' ||
      personData.address === null ||
      !('country' in personData.address) ||
      typeof personData.address.country !== 'string' ||
      personData.address.country.length !== 2
    ) {
      throw new Error('Missing country property.');
    }

    if (!('role' in personData) || typeof personData.role !== 'string') {
      throw new Error('Missing role property.');
    }

    people.push({
      firstName: capitalizeFirstLetter(personData.firstName),
      lastName: capitalizeFirstLetter(personData.lastName),
      nationality: personData.address.country,
      role: personData.role === 'participant' ? 'participant' : 'counselor',
    });
  }

  return makeUniqueNames(people).map((person) => ({
    id: crypto.randomUUID(),
    name: person.name,
    role: person.role,
    nationality: person.nationality,
  }));
}

function capitalizeFirstLetter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
