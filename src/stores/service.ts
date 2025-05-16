import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PersistenceService } from 'src/services/persistence/PersistenceService';
import { FirestoreDataService } from 'src/services/persistence/FirestoreDataService';
import { LocalStorageService } from 'src/services/persistence/LocalStorageService';
import type { AuthenticationService } from 'src/services/auth/AuthenticationService';
import { FirebaseAuthService } from 'src/services/auth/FirebaseAuthService';

export const useServiceStore = defineStore('service', () => {
  const dataService = ref<PersistenceService | null>();
  const authService = ref<AuthenticationService | null>(
    new FirebaseAuthService(),
  );

  function loadDataService(provider?: string) {
    switch (provider) {
      case 'LOCAL': {
        dataService.value = new LocalStorageService();
        break;
      }
      case 'FIRESTORE': {
        dataService.value = new FirestoreDataService();
        break;
      }
      default: {
        dataService.value = undefined;
      }
    }
  }

  function isInitialized() {
    return dataService.value == null;
  }

  return { dataService, authService, isInitialized, loadDataService };
});
