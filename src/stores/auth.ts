import { defineStore } from 'pinia';
import { ref } from 'vue';
import { User } from 'src/lib/entities';
import { Identifiable } from 'src/lib/utils/Identifiable';
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
    await serviceStore.dataService?.loadUserData(user.value);
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
    user.value = new User(Identifiable.generateNewId(), 'LOCAL', 'Local', true);
  }

  async function logout(): Promise<void> {
    if (!serviceStore.authService) {
      throw 'auth_service_unavailable';
    }

    await serviceStore.authService.logout();

    if (serviceStore.dataService) {
      await serviceStore.dataService.unloadUserData();
      await serviceStore.dataService.unloadFlight();
      await serviceStore.dataService.unloadProject();
    }

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
