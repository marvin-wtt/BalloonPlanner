import { readXlsxFile, type Schema } from 'read-excel-file';

interface PersonSheetOptions {
  sheetName?: string;
  nameColumn?: string;
  nationColumn?: string;
  supervisorColumn?: string;
  flightsColumn?: string;
  firstTime?: string;
}

export function generateShema(options: PersonSheetOptions): Schema {
  return {
    [options.nameColumn ?? 'name']: {
      prop: 'name',
      type: String,
      required: true,
    },
    [options.nationColumn ?? 'nation']: {
      prop: 'nation',
      type: String,
      oneOf: ['de', 'fr', 'pl'],
    },
    [options.supervisorColumn ?? 'supervisor']: {
      prop: 'supervisor',
      parse: (cell) => {
        return cell === true ? cell : cell === 1 ? true : false;
      },
      required: false,
    },
    [options.flightsColumn ?? 'flights']: {
      prop: 'numberOfFlights',
      type: Number,
      required: false,
    },
    [options.firstTime ?? 'supervisor']: {
      prop: 'supervisor',
      parse: (cell) => {
        return cell === true ? cell : cell === 1 ? true : false;
      },
      required: false,
    },
  };
}

export async function load<T extends object>(
  file: File,
  shema: Schema,
  options?: PersonSheetOptions,
): Promise<T[]> {
  const data = await readXlsxFile<T>(file, {
    sheet: options?.sheetName ?? 1,
    schema: shema,
  });

  if (data.errors.length > 0) {
    throw new Error('no_data');
  }

  return data.rows;
}
