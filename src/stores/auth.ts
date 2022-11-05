import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { User } from 'firebase/auth';
import { User as LocalUser } from 'src/lib/entities';
import { Identifyable } from 'src/lib/utils/Identifyable';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<LocalUser>();

  let initialized = false;

  function initialize() {
    if (initialized) {
      return;
    }

    const auth = getAuth();
    onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUserCredentials(authUser);
      } else {
        auth.signOut();
        user.value = undefined;
      }
    });

    initialized = true;
  }

  function authenticated(): boolean {
    return user.value?.local === true || user.value?.id != null;
  }

  function setUserCredentials(authUser: User) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    const username = authUser.displayName ?? 'User';

    user.value = new LocalUser(
      authUser.uid,
      username,
      user.value?.email ?? '',
      false
    );
  }

  async function register(u: string, e: string, p: string) {
    const auth = getAuth();
    return new Promise((resolve, reject) => {
      createUserWithEmailAndPassword(auth, e, p)
        .then((userCredential) => {
          // Signed in
          const authUser = userCredential.user;
          setUserCredentials(authUser);

          resolve({ username: user.value?.name });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async function loginEmail(e: string, p: string): Promise<void> {
    const auth = getAuth();
    return new Promise((resolve, reject) => {
      signInWithEmailAndPassword(auth, e, p)
        .then((userCredential) => {
          const user = userCredential.user;
          setUserCredentials(user);
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  function loginLocal(): void {
    user.value = new LocalUser(Identifyable.generateNewId(), 'Local', '', true);
  }

  function logout(): void {
    const auth = getAuth();
    auth.signOut();

    user.value = undefined;
  }

  return {
    user,
    initialize,
    register,
    authenticated,
    loginEmail,
    loginLocal,
    logout,
  };
});
