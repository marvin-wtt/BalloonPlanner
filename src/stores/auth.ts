import { defineStore } from 'pinia';
import { ref } from 'vue';
import { User } from 'src/lib/entities';
import { Identifyable } from 'src/lib/utils/Identifyable';
import { useServiceStore } from 'stores/service';

export const useAuthStore = defineStore('auth', () => {
  const serviceStore = useServiceStore();
  const user = ref<User>();

  async function authenticated(): Promise<boolean> {
    return (await serviceStore.authService?.authenticated()) ?? false;
  }

  async function loadUser(authUser: User) {
    user.value = authUser;
    serviceStore.loadDataService(authUser.provider);
    await serviceStore.dataService?.loadUser(authUser.id);
  }

  async function register(email: string, password: string) {
    if (!serviceStore.authService) {
      throw 'auth_service_unavailable';
    }

    return serviceStore.authService.register(email, password);
  }

  async function loginEmail(e: string, p: string): Promise<User> {
    if (!serviceStore.authService) {
      throw 'auth_service_unavailable';
    }

    return serviceStore.authService.login(e, p);
  }

  function loginLocal(): void {
    user.value = new User(Identifyable.generateNewId(), 'LOCAL', 'Local', true);
  }

  function logout(): void {
    user.value = undefined;
  }

  return {
    user,
    loadUser,
    register,
    authenticated,
    loginEmail,
    loginLocal,
    logout,
  };
});
