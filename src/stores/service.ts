import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PersistenceService } from 'src/services/persistence/PersistenceService';
import { useAuthStore } from 'stores/auth';
import { FirestoreDataService } from 'src/services/persistence/FirestoreDataService';
import { LocalStorageService } from 'src/services/persistence/LocalStorageService';
import { AuthenticationService } from 'src/services/auth/AuthenticationService';
import { FirebaseAuthSerivice } from 'src/services/auth/FirebaseAuthSerivice';

export const useServiceStore = defineStore('service', () => {
  const dataService = ref<PersistenceService | null>();
  const authService = ref<AuthenticationService | null>(
    new FirebaseAuthSerivice()
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
