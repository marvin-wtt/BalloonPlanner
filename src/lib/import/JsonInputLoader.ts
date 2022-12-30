import { Person } from 'src/lib/entities';

export async function loadJson(file: File): Promise<Person[]> {
  const content = await readFile(file);
  const json = JSON.parse(content);

  if (!Array.isArray(json)) {
    throw 'invalid_file_content';
  }

  const people: Person[] = [];
  for (const personData of json) {
    if (
      !personData.hasOwnProperty('first_name') ||
      typeof personData.first_name !== 'string'
    ) {
      throw 'invalid_file_content';
    }

    if (
      !personData.hasOwnProperty('country') ||
      typeof personData.country !== 'string' ||
      personData.country.length !== 2
    ) {
      throw 'invalid_file_content';
    }

    const person = new Person(
      capitalizeFirstLetter(personData.first_name),
      personData.country,
      false,
      0
    );
    people.push(person);
  }

  return people;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const result = fileReader.result;
      typeof result === 'string' ? resolve(result) : reject('invalid_file');
    };
    fileReader.onerror = reject;
    fileReader.readAsText(file);
  });
}

function capitalizeFirstLetter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
