import type { Person } from 'app/src-common/entities';

export async function loadJson(file: File): Promise<Person[]> {
  const content = await readFile(file);
  const json = JSON.parse(content);

  if (!Array.isArray(json)) {
    throw new Error('invalid_file_content');
  }

  const people: Person[] = [];
  for (const personData of json) {
    if (
      !('firstName' in personData) ||
      typeof personData.first_name !== 'string'
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
      !('country' in personData.address) ||
      typeof personData.address.country !== 'string' ||
      personData.country.length !== 2
    ) {
      throw new Error('Missing country property.');
    }

    if (!('role' in personData) || typeof personData.role !== 'string') {
      throw new Error('Missing last name property.');
    }

    people.push({
      id: crypto.randomUUID(),
      name:
        capitalizeFirstLetter(personData.first_name) +
        ' ' +
        capitalizeFirstLetter(personData.lastName),
      nationality: personData.address.country,
      role: personData.role, // TODO Match roles
    });
  }

  return people;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const result = fileReader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('invalid_file'));
      }
    };
    fileReader.onerror = reject;
    fileReader.readAsText(file);
  });
}

function capitalizeFirstLetter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
