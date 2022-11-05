import { Identifyable } from 'src/lib/utils/Identifyable';

export class User extends Identifyable {
  private _name: string;
  private _email: string;
  private _local: boolean;

  constructor(id: string, name: string, email: string, local: boolean) {
    super(id);
    this._name = name;
    this._email = email;
    this._local = local;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get email(): string {
    return this._email;
  }

  set email(value: string) {
    this._email = value;
  }

  get local(): boolean {
    return this._local;
  }

  set local(value: boolean) {
    this._local = value;
  }
}