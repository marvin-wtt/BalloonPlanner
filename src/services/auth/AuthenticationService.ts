import { User } from 'src/lib/entities';

export interface AuthenticationService {
  authenticated(): Promise<boolean>;

  login(username: string, password?: string): Promise<User>;

  register(username: string, password?: string): Promise<User>;

  logout(): Promise<void>;
}