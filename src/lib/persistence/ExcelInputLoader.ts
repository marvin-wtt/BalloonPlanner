import { InputLoader } from 'src/lib/persistence/InputLoader';
import { Project } from 'src/lib/entities/Project';
import { Person } from 'src/lib/entities/Person';
import readXlsxFile from 'read-excel-file';

interface Input {
  name: string;
  nation: string;
  supervisor: boolean;
  flights: number;
}

export class ExcelInputLoader implements InputLoader {
  private _input: File;
  private _sheetName?: string;
  private _nameColumn: string;
  private _nationColumn: string;
  private _supervisorColumn: string;
  private _flightsColumn: string;

  constructor(input: File) {
    this._input = input;
    this._nameColumn = 'name';
    this._nationColumn = 'nation';
    this._supervisorColumn = 'supervisor';
    this._flightsColumn = 'flights';
  }

  get input(): File {
    return this._input;
  }

  set input(input: File) {
    this._input = input;
  }

  set sheetName(value: string) {
    this._sheetName = value;
  }

  get nameColumn(): string {
    return this._nameColumn;
  }

  set nameColumn(value: string) {
    this._nameColumn = value;
  }

  get nationColumn(): string {
    return this._nationColumn;
  }

  set nationColumn(value: string) {
    this._nationColumn = value;
  }

  get supervisorColumn(): string {
    return this._supervisorColumn;
  }

  set supervisorColumn(value: string) {
    this._supervisorColumn = value;
  }

  get flightsColumn(): string {
    return this._flightsColumn;
  }

  set flightsColumn(value: string) {
    this._flightsColumn = value;
  }

  private gernerateShema() {
    return {
      [this._nameColumn]: {
        prop: 'name',
        type: String,
        required: true,
      },
      [this._nationColumn]: {
        prop: 'nation',
        type: String,
        oneOf: ['de', 'fr', 'pl'],
      },
      [this._supervisorColumn]: {
        prop: 'supervisor',
        type: Boolean,
      },
      [this._flightsColumn]: {
        prop: 'numberOfFlights',
        type: Number,
      },
    };
  }

  public load(project: Project): Promise<Project> {
    if (project === undefined) {
      project = new Project();
    }
    const sheet = this._sheetName ?? 1;
    const shema = this.gernerateShema();

    return new Promise<Project>((resolve, reject) => {
      readXlsxFile<Input>(this._input, {
        sheet: sheet,
        schema: shema,
      })
        .then((data) => {
          if (data.errors.length > 0) {
            // TODO set precise error message
            reject('invalid_input');
            return;
          }

          for (const row of data.rows) {
            if (row.name === null || row.nation == null) {
              reject('invalid_name_or_nation');
              return;
            }

            const person = new Person(
              row.name,
              row.nation,
              row.supervisor ?? undefined,
              row.flights ?? undefined
            );

            project.people.push(person);
          }

          resolve(project);
        })
        .catch(() => {
          reject('read_failed');
        });
    });
  }
}
