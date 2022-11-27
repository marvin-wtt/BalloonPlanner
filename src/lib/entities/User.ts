import { Identifyable } from 'src/lib/utils/Identifyable';
import { Project } from 'src/lib/entities/Project';

export class User extends Identifyable {
  private _provider: string;
  private _name: string;
  private _email?: string;
  private _local: boolean;
  private _projects: string[];

  constructor(
    id: string,
    provider: string,
    name: string,
    local: boolean,
    projects?: string[]
  ) {
    super(id);
    this._provider = provider;
    this._name = name;
    this._local = local;
    this._projects = projects ?? [];
  }

  get provider(): string {
    return this._provider;
  }

  set provider(value: string) {
    this._provider = value;
  }

  get projects(): string[] {
    return this._projects;
  }

  set projects(value: string[]) {
    this._projects = value;
  }

  addProject(project: Project) {
    this._projects.push(project.id);
  }

  removeProject(project: Project) {
    this._projects = this._projects.filter((value) => value != project.id);
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get email(): string | undefined {
    return this._email;
  }

  set email(value: string | undefined) {
    this._email = value;
  }

  get local(): boolean {
    return this._local;
  }

  set local(value: boolean) {
    this._local = value;
  }
}
