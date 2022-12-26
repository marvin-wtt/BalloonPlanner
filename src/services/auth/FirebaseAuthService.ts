import { AuthenticationService } from 'src/services/auth/AuthenticationService';
import { User } from 'src/lib/entities';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useAuthStore } from 'stores/auth';
import { User as FirebaseUser } from 'firebase/auth';

export class FirebaseAuthService implements AuthenticationService {
  static PROVIDER_NAME = 'FIRESTORE';

  private _unsubscribeStateChange?: () => void;
  private _initialized = false;
  private _authenticated = false;

  authenticated(): Promise<boolean> {
    if (this._initialized) {
      return Promise.resolve(this._authenticated);
    }

    this.initialize();
    return new Promise<boolean>((resolve) => {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (authUser) => {
        unsubscribe();
        resolve(authUser != null);
      });
    });
  }

  initialize() {
    const auth = getAuth();
    const authStore = useAuthStore();
    this._unsubscribeStateChange = onAuthStateChanged(auth, (authUser) => {
      if (authUser != null) {
        const user = this.createUser(authUser);
        authStore.loadUser(user);
      } else {
        authStore.logout();
      }

      this._authenticated = authUser != null;
      this._initialized = true;
    });
  }

  async login(email: string, password?: string): Promise<User> {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    if (!password) {
      throw 'password_required';
    }

    const auth = getAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return this.createUser(credential.user);
  }

  async register(email: string, password?: string): Promise<User> {
    if (!password) {
      throw 'password_required';
    }

    const auth = getAuth();
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return this.createUser(credential.user);
  }

  createUser(firebaseUser: FirebaseUser): User {
    return new User(
      firebaseUser.email ?? firebaseUser.uid,
      FirebaseAuthService.PROVIDER_NAME,
      firebaseUser.displayName ?? firebaseUser.email ?? firebaseUser.uid,
      false
    );
  }

  async logout(): Promise<void> {
    const auth = getAuth();
    await auth.signOut();
    this._authenticated = false;
  }
}
