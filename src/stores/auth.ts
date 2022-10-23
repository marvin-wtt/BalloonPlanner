import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { User } from 'firebase/auth';

export const useAuthStore = defineStore('auth', () => {
  const username = ref<string>();
  const email = ref<string>();
  const local = ref<boolean>(false);

  async function authenticated() {
    return local.value || username.value !== undefined;
  }

  function setUserCredentials(user: User) {
    email.value = user.email || '';
    username.value = user.displayName ?? user.uid;
    local.value = false;
  }

  async function register(u: string, e: string, p: string) {
    const auth = getAuth();
    return new Promise((resolve, reject) => {
      createUserWithEmailAndPassword(auth, e, p)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          setUserCredentials(user);

          resolve({ username: username.value });
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
    username.value = 'Local';
    local.value = true;
  }

  function logout(): void {
    const auth = getAuth();
    auth.signOut();

    username.value = undefined;
    email.value = undefined;
    local.value = false;
  }

  return {
    username,
    email,
    local,
    register,
    authenticated,
    loginEmail,
    loginLocal,
    logout,
  };
});
