import type { Person } from 'app/src-common/entities';

export async function loadJson(file: File): Promise<Person[]> {
  const content = await readFile(file);
  let data = JSON.parse(content);

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

  const people: Person[] = [];
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
      id: crypto.randomUUID(),
      name:
        capitalizeFirstLetter(personData.firstName) +
        ' ' +
        capitalizeFirstLetter(personData.lastName),
      nationality: personData.address.country,
      role: personData.role === 'participant' ? 'participant' : 'counselor',
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
    fileReader.readAsText(file, 'ISO-8859-1');
  });
}

function capitalizeFirstLetter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
