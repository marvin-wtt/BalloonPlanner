import { Identifiable } from 'src/lib/utils/Identifiable';
import { Project } from 'src/lib/entities/Project';

export class User extends Identifiable {
  private _provider: string;
  private _name: string;
  private _email?: string;
  private _local: boolean;
  private _projects: Project[];

  constructor(
    id: string,
    provider: string,
    name: string,
    local: boolean,
    projects?: Project[]
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

  get projects(): Project[] {
    return this._projects;
  }

  set projects(value: Project[]) {
    this._projects = value;
  }

  addProject(project: Project) {
    this._projects.push(project);
  }

  removeProject(project: Project) {
    this._projects = this._projects.filter((value) => value.id !== project.id);
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
